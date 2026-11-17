class ApplicationController < ActionController::API
  include ActionController::Cookies

  before_action :ensure_json_request_for_writes

  rescue_from ActiveRecord::RecordNotFound do
    render json: { error: "Not found" }, status: :not_found
  end

  private

  def current_user
    return @current_user if defined?(@current_user)

    @current_user = User.find_by(id: session[:user_id])
  end

  def require_login
    return if current_user

    render json: { error: "Unauthorized" }, status: :unauthorized
  end

  def require_seller!
    require_login
    return if performed?
    return if current_user.seller?

    render json: { error: "Forbidden" }, status: :forbidden
  end

  def require_buyer!
    require_login
    return if performed?
    return if current_user.buyer?

    render json: { error: "Forbidden" }, status: :forbidden
  end

  # Simple CSRF mitigation for cookie-based SPA auth: browsers' cross-site
  # form posts cannot set application/json Content-Type without CORS preflight.
  def ensure_json_request_for_writes
    return if request.get? || request.head? || request.options?
    return if request.media_type == "application/json"
    # Allow empty-body DELETE/logout without an explicit Content-Type.
    return if request.raw_post.blank? && request.delete?

    render json: { error: "Content-Type must be application/json" }, status: :unsupported_media_type
  end


  def user_json(user)
    { id: user.id, email: user.email, role: user.role }
  end
end
