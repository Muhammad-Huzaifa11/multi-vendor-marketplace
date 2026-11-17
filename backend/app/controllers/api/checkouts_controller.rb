module Api
  class CheckoutsController < ApplicationController
    before_action :require_buyer!

    def create
      result = CheckoutService.new(
        buyer: current_user,
        items: checkout_items,
        idempotency_key: request.headers["Idempotency-Key"]
      ).call

      render json: result.body, status: result.status
    rescue CheckoutService::Error => e
      render json: e.body, status: e.status
    end

    private

    def checkout_items
      raw = params.require(:items)
      raw.map do |item|
        item.permit(:product_id, :quantity).to_h.symbolize_keys
      end
    end
  end
end
