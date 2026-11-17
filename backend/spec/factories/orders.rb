FactoryBot.define do
  factory :order do
    association :buyer, factory: %i[user buyer]
    association :seller, factory: %i[user seller]
    subtotal_cents { 1000 }
    commission_cents { 100 }
    seller_earnings_cents { 900 }

    trait :with_item do
      after(:create) do |order|
        product = create(:product, seller: order.seller)
        create(:order_item, order: order, product: product)
      end
    end
  end
end
