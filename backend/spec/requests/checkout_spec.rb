require "rails_helper"

RSpec.describe "Checkout", type: :request do
  let(:buyer) { create(:user, :buyer) }
  let(:seller_a) { create(:user, :seller) }
  let(:seller_b) { create(:user, :seller) }

  def checkout!(user, items, key:)
    login_as(user)
    post "/api/checkout",
         params: { items: items }.to_json,
         headers: json_headers.merge("Idempotency-Key" => key)
  end

  describe "per-seller split and commission" do
    it "creates one order per seller with 10% floor commission and price snapshots" do
      product_a = create(:product, seller: seller_a, price_cents: 1000, stock: 5, title: "A")
      product_b = create(:product, seller: seller_b, price_cents: 2500, stock: 5, title: "B")

      checkout!(
        buyer,
        [
          { product_id: product_a.id, quantity: 2 },
          { product_id: product_b.id, quantity: 1 }
        ],
        key: "split-1"
      )

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body["orders"].length).to eq(2)

      order_a = Order.find_by!(seller_id: seller_a.id, buyer_id: buyer.id)
      expect(order_a.subtotal_cents).to eq(2000)
      expect(order_a.commission_cents).to eq(200)
      expect(order_a.seller_earnings_cents).to eq(1800)
      expect(order_a.order_items.first.unit_price_cents).to eq(1000)
      expect(order_a.order_items.first.title).to eq("A")

      product_a.update!(price_cents: 9999)
      expect(order_a.order_items.first.reload.unit_price_cents).to eq(1000)
    end
  end

  describe "idempotent checkout" do
    it "returns the same orders when Pay is clicked twice with the same key" do
      product = create(:product, seller: seller_a, price_cents: 1000, stock: 5)

      checkout!(buyer, [{ product_id: product.id, quantity: 1 }], key: "pay-once")
      expect(response).to have_http_status(:created)
      first_body = JSON.parse(response.body)
      expect(Order.count).to eq(1)

      checkout!(buyer, [{ product_id: product.id, quantity: 1 }], key: "pay-once")
      expect(response).to have_http_status(:created)
      # Compare parsed JSON — jsonb may re-order keys when reloaded from Postgres.
      expect(JSON.parse(response.body)).to eq(first_body)
      expect(Order.count).to eq(1)
      expect(product.reload.stock).to eq(4)

    end

    it "rejects the same key with a different payload" do
      product = create(:product, seller: seller_a, stock: 5)

      checkout!(buyer, [{ product_id: product.id, quantity: 1 }], key: "same-key")
      expect(response).to have_http_status(:created)

      checkout!(buyer, [{ product_id: product.id, quantity: 2 }], key: "same-key")
      expect(response).to have_http_status(:unprocessable_entity)
      expect(Order.count).to eq(1)
    end
  end

  describe "overselling", :truncation do
    it "allows only one buyer to purchase the last unit under concurrency" do
      product = create(:product, seller: seller_a, stock: 1, price_cents: 500)
      buyer_one = create(:user, :buyer, email: "race1@example.com")
      buyer_two = create(:user, :buyer, email: "race2@example.com")

      barrier = Queue.new
      results = Queue.new

      threads = [buyer_one, buyer_two].each_with_index.map do |user, idx|
        Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do
            barrier.pop
            app = Rails.application
            env = Rack::MockRequest.env_for(
              "/api/login",
              method: "POST",
              input: { email: user.email, password: "password" }.to_json,
              "CONTENT_TYPE" => "application/json"
            )
            _status, headers, body = app.call(env)
            body.close if body.respond_to?(:close)
            set_cookie = Array(headers["Set-Cookie"] || headers["set-cookie"]).first.to_s
            cookie = set_cookie.split(";", 2).first

            env2 = Rack::MockRequest.env_for(
              "/api/checkout",
              method: "POST",
              input: { items: [{ product_id: product.id, quantity: 1 }] }.to_json,
              "CONTENT_TYPE" => "application/json",
              "HTTP_IDEMPOTENCY_KEY" => "race-#{idx}",
              "HTTP_COOKIE" => cookie
            )
            status2, _h, body2 = app.call(env2)
            body_str = body2.each.to_a.join
            body2.close if body2.respond_to?(:close)
            results << { status: status2, body: body_str }
          end
        end
      end


      2.times { barrier << true }
      threads.each(&:join)

      outcomes = 2.times.map { results.pop }
      successes = outcomes.select { |o| o[:status] == 201 }
      conflicts = outcomes.select { |o| o[:status] == 409 }

      expect(successes.length).to eq(1)
      expect(conflicts.length).to eq(1)
      expect(product.reload.stock).to eq(0)
      expect(Order.count).to eq(1)
      expect(OrderItem.count).to eq(1)
    end
  end
end
