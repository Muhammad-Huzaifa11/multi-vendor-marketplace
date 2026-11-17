require "rails_helper"

RSpec.describe "Auth and RBAC", type: :request do
  describe "POST /api/signup" do
    it "creates a buyer and starts a session" do
      post "/api/signup",
           params: {
             email: "newbuyer@example.com",
             password: "password",
             password_confirmation: "password",
             role: "buyer"
           }.to_json,
           headers: json_headers

      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body).dig("user", "role")).to eq("buyer")

      get "/api/me", headers: json_headers
      expect(response).to have_http_status(:ok)
    end
  end

  describe "role access" do
    let(:buyer) { create(:user, :buyer) }
    let(:seller) { create(:user, :seller) }
    let(:other_seller) { create(:user, :seller) }

    it "forbids a buyer from seller product routes" do
      login_as(buyer)

      get "/api/seller/products", headers: json_headers
      expect(response).to have_http_status(:forbidden)
    end

    it "returns not found when a seller reads another seller's order" do
      order = create(:order, :with_item, seller: other_seller, buyer: buyer)
      login_as(seller)

      get "/api/seller/orders/#{order.id}", headers: json_headers
      expect(response).to have_http_status(:not_found)
    end

    it "allows a seller to list their own products" do
      create(:product, seller: seller)
      login_as(seller)

      get "/api/seller/products", headers: json_headers
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["products"].length).to eq(1)
    end
  end
end
