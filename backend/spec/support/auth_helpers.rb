module AuthHelpers
  def json_headers
    { "CONTENT_TYPE" => "application/json", "ACCEPT" => "application/json" }
  end

  def login_as(user, password: "password")
    post "/api/login",
         params: { email: user.email, password: password }.to_json,
         headers: json_headers
  end
end
