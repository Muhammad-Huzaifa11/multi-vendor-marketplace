class CreateMarketplaceSchema < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :role, null: false, default: "buyer"
      t.timestamps
    end
    add_index :users, :email, unique: true

    create_table :products do |t|
      t.references :seller, null: false, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.integer :price_cents, null: false
      t.integer :stock, null: false, default: 0
      t.string :image_url
      t.string :category, null: false
      t.boolean :active, null: false, default: true
      t.timestamps
    end
    add_index :products, :category
    add_index :products, [:price_cents, :id]
    add_check_constraint :products, "price_cents >= 0", name: "products_price_cents_non_negative"
    add_check_constraint :products, "stock >= 0", name: "products_stock_non_negative"

    create_table :orders do |t|
      t.references :buyer, null: false, foreign_key: { to_table: :users }
      t.references :seller, null: false, foreign_key: { to_table: :users }
      t.integer :subtotal_cents, null: false
      t.integer :commission_cents, null: false
      t.integer :seller_earnings_cents, null: false
      t.timestamps
    end

    create_table :order_items do |t|
      t.references :order, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.string :title, null: false
      t.integer :unit_price_cents, null: false
      t.integer :quantity, null: false
      t.boolean :shipped, null: false, default: false
      t.timestamps
    end

    create_table :idempotency_keys do |t|
      t.references :user, null: false, foreign_key: true
      t.string :key, null: false
      t.string :request_hash, null: false
      t.jsonb :response_body, null: false, default: {}
      t.integer :response_status, null: false
      t.timestamps
    end
    add_index :idempotency_keys, [:user_id, :key], unique: true
  end
end
