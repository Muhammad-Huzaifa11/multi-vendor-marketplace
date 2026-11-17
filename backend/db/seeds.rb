def ensure_user!(email:, role:, store_name: nil)
  user = User.find_or_initialize_by(email: email)
  user.password = "password"
  user.password_confirmation = "password"
  user.role = role
  user.store_name = store_name if store_name.present?
  user.save!
  user
end

buyer = ensure_user!(email: "buyer@example.com", role: "buyer")
buyer2 = ensure_user!(email: "buyer2@example.com", role: "buyer")
seller1 = ensure_user!(email: "seller1@example.com", role: "seller", store_name: "Northside Goods")
seller2 = ensure_user!(email: "seller2@example.com", role: "seller", store_name: "River Market")

def placeholder(label)
  text = URI.encode_www_form_component(label)
  "https://placehold.co/400x400/e9ecef/495057/png?text=#{text}"
end



catalog = [
  { seller: seller1, title: "Ceramic Mug", price_cents: 1200, stock: 25, category: "Home", image_url: placeholder("Ceramic Mug") },
  { seller: seller1, title: "Desk Lamp", price_cents: 4500, stock: 10, category: "Home", image_url: placeholder("Desk Lamp") },
  { seller: seller1, title: "Notebook Set", price_cents: 800, stock: 40, category: "Office", image_url: placeholder("Notebook Set") },
  { seller: seller1, title: "Wireless Mouse", price_cents: 2200, stock: 15, category: "Electronics", image_url: placeholder("Wireless Mouse") },
  { seller: seller1, title: "Last Unit Headphones", price_cents: 9900, stock: 1, category: "Electronics", image_url: placeholder("Headphones") },
  { seller: seller1, title: "Plant Pot", price_cents: 1500, stock: 20, category: "Home", image_url: placeholder("Plant Pot") },
  { seller: seller1, title: "USB-C Hub", price_cents: 3500, stock: 12, category: "Electronics", image_url: placeholder("USB-C Hub") },
  { seller: seller1, title: "Pen Pack", price_cents: 500, stock: 50, category: "Office", image_url: placeholder("Pen Pack") },
  { seller: seller1, title: "Throw Blanket", price_cents: 3800, stock: 8, category: "Home", image_url: placeholder("Throw Blanket") },
  { seller: seller1, title: "Keyboard", price_cents: 6500, stock: 7, category: "Electronics", image_url: placeholder("Keyboard") },
  { seller: seller2, title: "Running Shoes", price_cents: 8900, stock: 14, category: "Fashion", image_url: placeholder("Running Shoes") },
  { seller: seller2, title: "Canvas Tote", price_cents: 1800, stock: 30, category: "Fashion", image_url: placeholder("Canvas Tote") },
  { seller: seller2, title: "Wool Scarf", price_cents: 2400, stock: 18, category: "Fashion", image_url: placeholder("Wool Scarf") },
  { seller: seller2, title: "Coffee Beans 1kg", price_cents: 2100, stock: 22, category: "Food", image_url: placeholder("Coffee Beans") },
  { seller: seller2, title: "Trail Mix", price_cents: 900, stock: 35, category: "Food", image_url: placeholder("Trail Mix") },
  { seller: seller2, title: "Yoga Mat", price_cents: 3200, stock: 16, category: "Sports", image_url: placeholder("Yoga Mat") },
  { seller: seller2, title: "Water Bottle", price_cents: 1600, stock: 28, category: "Sports", image_url: placeholder("Water Bottle") },
  { seller: seller2, title: "Resistance Bands", price_cents: 1400, stock: 24, category: "Sports", image_url: placeholder("Resistance Bands") },
  { seller: seller2, title: "Single Stock Tee", price_cents: 2500, stock: 1, category: "Fashion", image_url: placeholder("Stock Tee") },
  { seller: seller2, title: "Spice Set", price_cents: 2700, stock: 11, category: "Food", image_url: placeholder("Spice Set") },
  { seller: seller2, title: "Cutting Board", price_cents: 2900, stock: 9, category: "Home", image_url: placeholder("Cutting Board") },
  { seller: seller1, title: "Monitor Stand", price_cents: 4200, stock: 6, category: "Office", image_url: placeholder("Monitor Stand") },
  { seller: seller1, title: "Sticky Notes", price_cents: 400, stock: 60, category: "Office", image_url: placeholder("Sticky Notes") },
  { seller: seller2, title: "Beanie", price_cents: 1300, stock: 19, category: "Fashion", image_url: placeholder("Beanie") }
]

catalog.each do |attrs|
  product = Product.find_or_initialize_by(seller: attrs[:seller], title: attrs[:title])
  product.assign_attributes(
    price_cents: attrs[:price_cents],
    category: attrs[:category],
    image_url: attrs[:image_url],
    active: true
  )
  product.stock = attrs[:stock] if product.new_record?
  product.save!
end


# Always restore the oversell demo SKUs so reviewers can find them after archives/purchases.
[
  ["Last Unit Headphones", seller1],
  ["Single Stock Tee", seller2]
].each do |title, seller|
  Product.find_by!(seller: seller, title: title).update!(active: true, stock: 1)
end

puts "Seeded users: #{buyer.email}, #{buyer2.email}, #{seller1.email}, #{seller2.email} (password: password)"
puts "Stores: #{seller1.store_name}, #{seller2.store_name}"
puts "Seeded products: #{Product.count}"
