module Api
  class SessionsController < ApplicationController
    def create
      user = User.find_by(email: params.require(:email).to_s.strip.downcase)
      if user&.authenticate(params.require(:password))
        session[:user_id] = user.id
        render json: { user: user_json(user) }
      else
        render json: { error: "Invalid email or password" }, status: :unauthorized
      end
    end

    def destroy
      session.delete(:user_id)
      head :no_content
    end
  end
end
