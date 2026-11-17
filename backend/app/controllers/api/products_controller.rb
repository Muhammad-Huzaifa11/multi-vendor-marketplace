module Api
  class ProductsController < ApplicationController
    MAX_PER_PAGE = 20

    def index
      page = [params.fetch(:page, 1).to_i, 1].max
      per_page = [[params.fetch(:per_page, 12).to_i, 1].max, MAX_PER_PAGE].min

      scope = Product.active.includes(:seller)
      scope = scope.search(params[:q])
      scope = scope.by_category(params[:category])
      scope = scope.sorted_by_price(params[:sort])

      total = scope.count
      products = scope.offset((page - 1) * per_page).limit(per_page)

      render json: {
        products: products.map { |p| product_json(p) },
        meta: {
          page: page,
          per_page: per_page,
          total: total,
          total_pages: (total.to_f / per_page).ceil
        }
      }
    end

    def show
      product = Product.active.find(params[:id])
      render json: { product: product_json(product) }
    end

    private

    def product_json(product)
      {
        id: product.id,
        title: product.title,
        price_cents: product.price_cents,
        stock: product.stock,
        image_url: product.image_url,
        category: product.category,
        seller: {
          id: product.seller_id,
          store_name: product.seller.display_name
        }

      }
    end
  end
end
