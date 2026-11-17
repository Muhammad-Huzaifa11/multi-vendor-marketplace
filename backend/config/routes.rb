Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    get "up", to: "health#show"

    post "signup", to: "registrations#create"
    post "login", to: "sessions#create"
    delete "logout", to: "sessions#destroy"
    get "me", to: "me#show"

    resources :products, only: %i[index show]
    post "checkout", to: "checkouts#create"
    resources :orders, only: %i[index]

    namespace :seller do
      resources :products
      resources :orders, only: %i[index show]
      post "order_items/:id/ship", to: "order_items#ship"
    end
  end
end
