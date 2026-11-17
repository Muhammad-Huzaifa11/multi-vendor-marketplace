module Api
  class MeController < ApplicationController
    before_action :require_login

    def show
      render json: { user: user_json(current_user) }
    end
  end
end
