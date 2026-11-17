class Order < ApplicationRecord
  belongs_to :buyer, class_name: "User"
  belongs_to :seller, class_name: "User"
  has_many :order_items, dependent: :destroy

  validates :subtotal_cents, :commission_cents, :seller_earnings_cents,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  def status
    return "pending" if order_items.empty?

    shipped_count = order_items.count(&:shipped?)
    if shipped_count.zero?
      "pending"
    elsif shipped_count == order_items.size
      "shipped"
    else
      "partially_shipped"
    end
  end
end
