FactoryBot.define do
  factory :order_item do
    association :order
    association :product
    title { product.title }
    unit_price_cents { product.price_cents }
    quantity { 1 }
    shipped { false }
  end
end
