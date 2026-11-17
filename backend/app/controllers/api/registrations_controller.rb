module Api
  class RegistrationsController < ApplicationController
    def create
      user = User.new(registration_params)
      if user.save
        session[:user_id] = user.id
        render json: { user: user_json(user) }, status: :created
      else
        render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def registration_params
      params.permit(:email, :password, :password_confirmation, :role)
    end
  end
end
