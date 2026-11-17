buyer = User.find_or_create_by!(email: "buyer@example.com") do |u|
  u.password = "password"
  u.password_confirmation = "password"
  u.role = "buyer"
end

buyer2 = User.find_or_create_by!(email: "buyer2@example.com") do |u|
  u.password = "password"
  u.password_confirmation = "password"
  u.role = "buyer"
end

seller1 = User.find_or_create_by!(email: "seller1@example.com") do |u|
  u.password = "password"
  u.password_confirmation = "password"
  u.role = "seller"
end

seller2 = User.find_or_create_by!(email: "seller2@example.com") do |u|
  u.password = "password"
  u.password_confirmation = "password"
  u.role = "seller"
end

catalog = [
  { seller: seller1, title: "Ceramic Mug", price_cents: 1200, stock: 25, category: "Home", image_url: "https://picsum.photos/seed/mug/400" },
  { seller: seller1, title: "Desk Lamp", price_cents: 4500, stock: 10, category: "Home", image_url: "https://picsum.photos/seed/lamp/400" },
  { seller: seller1, title: "Notebook Set", price_cents: 800, stock: 40, category: "Office", image_url: "https://picsum.photos/seed/note/400" },
  { seller: seller1, title: "Wireless Mouse", price_cents: 2200, stock: 15, category: "Electronics", image_url: "https://picsum.photos/seed/mouse/400" },
  { seller: seller1, title: "Last Unit Headphones", price_cents: 9900, stock: 1, category: "Electronics", image_url: "https://picsum.photos/seed/headphones/400" },
  { seller: seller1, title: "Plant Pot", price_cents: 1500, stock: 20, category: "Home", image_url: "https://picsum.photos/seed/pot/400" },
  { seller: seller1, title: "USB-C Hub", price_cents: 3500, stock: 12, category: "Electronics", image_url: "https://picsum.photos/seed/hub/400" },
  { seller: seller1, title: "Pen Pack", price_cents: 500, stock: 50, category: "Office", image_url: "https://picsum.photos/seed/pen/400" },
  { seller: seller1, title: "Throw Blanket", price_cents: 3800, stock: 8, category: "Home", image_url: "https://picsum.photos/seed/blanket/400" },
  { seller: seller1, title: "Keyboard", price_cents: 6500, stock: 7, category: "Electronics", image_url: "https://picsum.photos/seed/keyboard/400" },
  { seller: seller2, title: "Running Shoes", price_cents: 8900, stock: 14, category: "Fashion", image_url: "https://picsum.photos/seed/shoes/400" },
  { seller: seller2, title: "Canvas Tote", price_cents: 1800, stock: 30, category: "Fashion", image_url: "https://picsum.photos/seed/tote/400" },
  { seller: seller2, title: "Wool Scarf", price_cents: 2400, stock: 18, category: "Fashion", image_url: "https://picsum.photos/seed/scarf/400" },
  { seller: seller2, title: "Coffee Beans 1kg", price_cents: 2100, stock: 22, category: "Food", image_url: "https://picsum.photos/seed/coffee/400" },
  { seller: seller2, title: "Trail Mix", price_cents: 900, stock: 35, category: "Food", image_url: "https://picsum.photos/seed/trail/400" },
  { seller: seller2, title: "Yoga Mat", price_cents: 3200, stock: 16, category: "Sports", image_url: "https://picsum.photos/seed/yoga/400" },
  { seller: seller2, title: "Water Bottle", price_cents: 1600, stock: 28, category: "Sports", image_url: "https://picsum.photos/seed/bottle/400" },
  { seller: seller2, title: "Resistance Bands", price_cents: 1400, stock: 24, category: "Sports", image_url: "https://picsum.photos/seed/bands/400" },
  { seller: seller2, title: "Single Stock Tee", price_cents: 2500, stock: 1, category: "Fashion", image_url: "https://picsum.photos/seed/tee/400" },
  { seller: seller2, title: "Spice Set", price_cents: 2700, stock: 11, category: "Food", image_url: "https://picsum.photos/seed/spice/400" },
  { seller: seller2, title: "Cutting Board", price_cents: 2900, stock: 9, category: "Home", image_url: "https://picsum.photos/seed/board/400" },
  { seller: seller1, title: "Monitor Stand", price_cents: 4200, stock: 6, category: "Office", image_url: "https://picsum.photos/seed/stand/400" },
  { seller: seller1, title: "Sticky Notes", price_cents: 400, stock: 60, category: "Office", image_url: "https://picsum.photos/seed/sticky/400" },
  { seller: seller2, title: "Beanie", price_cents: 1300, stock: 19, category: "Fashion", image_url: "https://picsum.photos/seed/beanie/400" }
]

catalog.each do |attrs|
  Product.find_or_create_by!(seller: attrs[:seller], title: attrs[:title]) do |p|
    p.price_cents = attrs[:price_cents]
    p.stock = attrs[:stock]
    p.category = attrs[:category]
    p.image_url = attrs[:image_url]
    p.active = true
  end
end

puts "Seeded users: #{buyer.email}, #{buyer2.email}, #{seller1.email}, #{seller2.email} (password: password)"
puts "Seeded products: #{Product.count}"
