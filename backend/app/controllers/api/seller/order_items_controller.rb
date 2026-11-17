module Api
  module Seller
    class OrderItemsController < ApplicationController
      before_action :require_seller!

      def ship
        item = OrderItem
               .joins(:order)
               .where(orders: { seller_id: current_user.id })
               .find(params[:id])

        item.update!(shipped: true)
        order = item.order
        order.order_items.reload

        render json: {
          order_item: {
            id: item.id,
            shipped: item.shipped
          },
          order: {
            id: order.id,
            status: order.status
          }
        }
      end
    end
  end
end
