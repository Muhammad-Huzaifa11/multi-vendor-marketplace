# Performs an all-or-nothing multi-seller checkout with:
# - pessimistic row locks (ORDER BY id) to prevent overselling and deadlocks
# - price snapshots on order_items
# - 10% platform commission (floor)
# - idempotency via (user_id, key) so double-Pay returns the same orders
class CheckoutService
  COMMISSION_RATE = 0.10

  Result = Struct.new(:status, :body, keyword_init: true)

  class Error < StandardError
    attr_reader :status, :body

    def initialize(status:, body:)
      @status = status
      @body = body
      super(body[:error] || body[:errors]&.join(", ") || "Checkout failed")
    end
  end

  def initialize(buyer:, items:, idempotency_key:)
    @buyer = buyer
    @items = normalize_items(items)
    @idempotency_key = idempotency_key.to_s.strip
  end

  def call
    raise Error.new(status: :unprocessable_entity, body: { error: "Idempotency-Key is required" }) if @idempotency_key.blank?
    raise Error.new(status: :unprocessable_entity, body: { error: "Cart is empty" }) if @items.empty?

    request_hash = Digest::SHA256.hexdigest(@items.to_json)

    existing = IdempotencyKey.find_by(user_id: @buyer.id, key: @idempotency_key)
    if existing
      if existing.request_hash != request_hash
        raise Error.new(
          status: :unprocessable_entity,
          body: { error: "Idempotency-Key was reused with a different payload" }
        )
      end

      return Result.new(status: existing.response_status, body: existing.response_body)
    end

    orders = nil
    ActiveRecord::Base.transaction do
      product_ids = @items.map { |i| i[:product_id] }.uniq.sort
      # Lock in ascending id order so concurrent checkouts cannot deadlock.
      products = Product.lock.where(id: product_ids, active: true).order(:id).index_by(&:id)

      unavailable = []
      @items.each do |item|
        product = products[item[:product_id]]
        if product.nil?
          unavailable << { product_id: item[:product_id], reason: "not_found" }
        elsif product.stock < item[:quantity]
          unavailable << {
            product_id: item[:product_id],
            reason: "insufficient_stock",
            available: product.stock,
            requested: item[:quantity]
          }
        end
      end

      if unavailable.any?
        raise Error.new(
          status: :conflict,
          body: { error: "Some items are unavailable", unavailable: unavailable }
        )
      end

      # Re-price from locked product rows; never trust client prices.
      grouped = Hash.new { |h, k| h[k] = [] }
      @items.each do |item|
        product = products[item[:product_id]]
        product.stock -= item[:quantity]
        product.save!
        grouped[product.seller_id] << { product: product, quantity: item[:quantity] }
      end

      orders = grouped.map do |seller_id, lines|
        subtotal = lines.sum { |l| l[:product].price_cents * l[:quantity] }
        # Documented rounding: floor(subtotal * 10%).
        commission = (subtotal * COMMISSION_RATE).floor
        earnings = subtotal - commission

        order = Order.create!(
          buyer: @buyer,
          seller_id: seller_id,
          subtotal_cents: subtotal,
          commission_cents: commission,
          seller_earnings_cents: earnings
        )

        lines.each do |line|
          order.order_items.create!(
            product: line[:product],
            title: line[:product].title,
            unit_price_cents: line[:product].price_cents,
            quantity: line[:quantity],
            shipped: false
          )
        end

        order
      end

      body = { orders: orders.map { |o| order_payload(o) } }
      IdempotencyKey.create!(
        user: @buyer,
        key: @idempotency_key,
        request_hash: request_hash,
        response_body: body,
        response_status: 201
      )

      Result.new(status: 201, body: body)
    end
  rescue Error
    raise
  rescue ActiveRecord::RecordNotUnique
    # Concurrent duplicate key: return the stored response.
    existing = IdempotencyKey.find_by!(user_id: @buyer.id, key: @idempotency_key)
    if existing.request_hash != Digest::SHA256.hexdigest(@items.to_json)
      raise Error.new(
        status: :unprocessable_entity,
        body: { error: "Idempotency-Key was reused with a different payload" }
      )
    end

    Result.new(status: existing.response_status, body: existing.response_body)
  end

  private

  def normalize_items(items)
    Array(items).map do |item|
      {
        product_id: item[:product_id].to_i,
        quantity: item[:quantity].to_i
      }
    end.reject { |i| i[:product_id] <= 0 || i[:quantity] <= 0 }
       .group_by { |i| i[:product_id] }
       .map { |pid, rows| { product_id: pid, quantity: rows.sum { |r| r[:quantity] } } }
  end

  def order_payload(order)
    order.reload
    {
      id: order.id,
      buyer_id: order.buyer_id,
      seller_id: order.seller_id,
      subtotal_cents: order.subtotal_cents,
      commission_cents: order.commission_cents,
      seller_earnings_cents: order.seller_earnings_cents,
      status: order.status,
      items: order.order_items.map do |item|
        {
          id: item.id,
          product_id: item.product_id,
          title: item.title,
          unit_price_cents: item.unit_price_cents,
          quantity: item.quantity,
          shipped: item.shipped
        }
      end
    }
  end
end
