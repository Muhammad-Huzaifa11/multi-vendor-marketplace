module Api
  module Seller
    class ProductsController < ApplicationController
      before_action :require_seller!
      before_action :set_product, only: %i[show update destroy]

      def index
        products = current_user.products.order(created_at: :desc)
        render json: { products: products.map { |p| seller_product_json(p) } }
      end

      def show
        render json: { product: seller_product_json(@product) }
      end

      def create
        product = current_user.products.build(product_params)
        if product.save
          render json: { product: seller_product_json(product) }, status: :created
        else
          render json: { errors: product.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @product.update(product_params)
          render json: { product: seller_product_json(@product) }
        else
          render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @product.update!(active: false)
        render json: { product: seller_product_json(@product) }
      end

      private

      def set_product
        @product = current_user.products.find(params[:id])
      end

      def product_params
        params.permit(:title, :price_cents, :stock, :image_url, :category, :active)
      end

      def seller_product_json(product)
        {
          id: product.id,
          title: product.title,
          price_cents: product.price_cents,
          stock: product.stock,
          image_url: product.image_url,
          category: product.category,
          active: product.active
        }
      end
    end
  end
end
