module Api
  class OrdersController < ApplicationController
    before_action :require_buyer!

    def index
      orders = current_user.orders_as_buyer.includes(:order_items, :seller).order(created_at: :desc)
      render json: { orders: orders.map { |o| order_json(o) } }
    end

    private

    def order_json(order)
      {
        id: order.id,
        seller: { id: order.seller_id, store_name: order.seller.display_name },

        subtotal_cents: order.subtotal_cents,
        commission_cents: order.commission_cents,
        seller_earnings_cents: order.seller_earnings_cents,
        status: order.status,
        created_at: order.created_at,
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
end
