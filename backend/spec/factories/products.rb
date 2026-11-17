FactoryBot.define do
  factory :product do
    association :seller, factory: %i[user seller]
    sequence(:title) { |n| "Product #{n}" }
    price_cents { 1000 }
    stock { 10 }
    category { "General" }
    image_url { "https://picsum.photos/seed/product/400" }
    active { true }
  end
end
