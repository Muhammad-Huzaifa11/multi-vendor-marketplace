class User < ApplicationRecord
  has_secure_password

  ROLES = %w[buyer seller].freeze

  has_many :products, foreign_key: :seller_id, dependent: :destroy, inverse_of: :seller
  has_many :orders_as_buyer, class_name: "Order", foreign_key: :buyer_id, inverse_of: :buyer, dependent: :destroy
  has_many :orders_as_seller, class_name: "Order", foreign_key: :seller_id, inverse_of: :seller, dependent: :destroy
  has_many :idempotency_keys, dependent: :destroy

  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :role, inclusion: { in: ROLES }
  validates :password, length: { minimum: 6 }, if: -> { new_record? || password.present? }

  before_validation :normalize_email

  def buyer?
    role == "buyer"
  end

  def seller?
    role == "seller"
  end

  def display_name
    store_name.presence || email.split("@").first
  end

  private


  def normalize_email
    self.email = email.to_s.strip.downcase
  end
end
