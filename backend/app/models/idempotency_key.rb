class IdempotencyKey < ApplicationRecord
  belongs_to :user

  validates :key, presence: true
  validates :request_hash, presence: true
  validates :response_status, presence: true
  validates :key, uniqueness: { scope: :user_id }
end
