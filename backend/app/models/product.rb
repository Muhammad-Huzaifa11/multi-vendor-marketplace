class Product < ApplicationRecord
  belongs_to :seller, class_name: "User"
  has_many :order_items, dependent: :restrict_with_exception

  validates :title, presence: true
  validates :category, presence: true
  validates :price_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :stock, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :seller_must_be_seller

  scope :active, -> { where(active: true) }
  scope :by_category, ->(category) { where(category: category) if category.present? }
  scope :search, lambda { |query|
    return all if query.blank?

    where("title ILIKE ?", "%#{ActiveRecord::Base.sanitize_sql_like(query)}%")
  }


  def self.sorted_by_price(direction)
    dir = direction.to_s == "price_desc" ? "DESC" : "ASC"
    order(Arel.sql("price_cents #{dir}, id ASC"))
  end

  private

  def seller_must_be_seller
    return if seller&.seller?

    errors.add(:seller, "must have seller role")
  end
end
