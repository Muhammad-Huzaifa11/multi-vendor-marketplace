module Api
  module Seller
    class OrdersController < ApplicationController
      before_action :require_seller!

      def index
        orders = current_user.orders_as_seller.includes(:order_items, :buyer).order(created_at: :desc)
        render json: { orders: orders.map { |o| order_json(o) } }
      end

      def show
        order = current_user.orders_as_seller.includes(:order_items, :buyer).find(params[:id])
        render json: { order: order_json(order) }
      end

      private

      def order_json(order)
        {
          id: order.id,
          buyer: { id: order.buyer_id, email: order.buyer.email },
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
end
