FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    password { "password" }
    password_confirmation { "password" }
    role { "buyer" }

    trait :buyer do
      role { "buyer" }
    end

    trait :seller do
      role { "seller" }
    end
  end
end
