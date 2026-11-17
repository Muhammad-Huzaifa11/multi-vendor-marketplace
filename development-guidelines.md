# Development Guidelines

This document outlines the preferred development patterns and conventions for this Rails application. Please follow these guidelines when making changes or adding new features.

## Frontend Development

### JavaScript Framework
- **Use Stimulus** for all interactive JavaScript functionality
- **Avoid** raw JavaScript event listeners and DOM manipulation
- **Prefer** Stimulus actions (`data-action`) over `addEventListener`
- **Use** Stimulus targets (`data-target`) for element references
- **Leverage** Stimulus values (`data-value`) for configuration

### Turbo/Turbo Streams
- **Use Turbo Streams** for dynamic content updates instead of AJAX requests
- **Prefer** server-side rendering with Turbo Stream responses
- **Avoid** manual `fetch()` or `XMLHttpRequest` calls in Stimulus controllers
- **Use** `data-turbo-method` and `data-turbo-confirm` for form submissions
- **Leverage** Turbo Frames for partial page updates

#### When to Use Stimulus vs Turbo
- **Use Stimulus** for:
  - Client-side interactions (toggles, animations, form validation)
  - DOM manipulation that doesn't require server data
  - Event handling and user interface state management
- **Use Turbo** for:
  - Server communication and data fetching
  - Dynamic content updates from server
  - Form submissions and page navigation
  - Any operation that requires server-side processing

#### Turbo Stream Patterns
```erb
<!-- Good: Use Turbo Streams for dynamic updates -->
<%= form_with model: @item, data: { turbo_stream: true } do |f| %>
  <%= f.submit "Update", data: { turbo_method: :patch } %>
<% end %>

<!-- Good: Use Turbo Frames for partial updates -->
<%= turbo_frame_tag "item_#{@item.id}" do %>
  <!-- Content that can be updated independently -->
<% end %>

<!-- Avoid: Manual AJAX in Stimulus -->
<button data-action="click->controller#fetchData">Fetch</button>
```

#### Controller Turbo Stream Responses
```ruby
# Good: Use Turbo Stream responses
def update
  if @item.update(item_params)
    respond_to do |format|
      format.turbo_stream { render turbo_stream: turbo_stream.replace("item_#{@item.id}", partial: "item", locals: { item: @item }) }
      format.html { redirect_to @item }
    end
  end
end

# Avoid: JSON responses for UI updates
def update
  if @item.update(item_params)
    render json: { success: true, html: render_to_string(partial: "item", locals: { item: @item }) }
  end
end
```

### Stimulus Patterns

#### Actions
```erb
<!-- Good: Use Stimulus actions -->
<button data-action="click->controller#method">Click me</button>
<input data-action="change->controller#updateValue">

<!-- Avoid: Raw JavaScript -->
<button onclick="someFunction()">Click me</button>
```

#### Targets
```erb
<!-- Good: Use Stimulus targets -->
<div data-controller="example">
  <div data-example-target="content"></div>
  <button data-action="click->example#updateContent">Update</button>
</div>
```

#### Values
```erb
<!-- Good: Use Stimulus values for configuration -->
<div data-controller="example" data-example-url-value="/api/data">
  <button data-action="click->example#fetchData">Fetch</button>
</div>
```

### CSS Framework
- **Use Bootstrap 5** for all UI components
- **Prefer** Bootstrap classes over custom CSS
- **Use** SCSS for custom styling when needed
- **Follow** Bootstrap's utility-first approach

### Component Examples

#### Accordions
```erb
<!-- Use Bootstrap 5 accordion structure -->
<div class="accordion" id="exampleAccordion">
  <div class="accordion-item">
    <h2 class="accordion-header" id="headingOne">
      <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne">
        Accordion Item
      </button>
    </h2>
    <div id="collapseOne" class="accordion-collapse collapse show">
      <div class="accordion-body">
        Content here
      </div>
    </div>
  </div>
</div>
```

#### Forms
```erb
<!-- Use Bootstrap form classes -->
<div class="form-check">
  <input class="form-check-input" type="checkbox" id="example" data-action="change->controller#method">
  <label class="form-check-label" for="example">Label</label>
</div>
```

## Backend Development

### Controllers
- **Follow** Rails conventions for controller structure
- **Use** strong parameters for form data
- **Implement** proper error handling and flash messages
- **Keep** controllers thin - move business logic to services

### Models
- **Use** ActiveRecord associations appropriately
- **Implement** validations for data integrity
- **Create** scopes for common queries
- **Use** concerns for shared functionality

### Services
- **Create** service objects for complex business logic
- **Place** services in `app/services/`
- **Use** descriptive class names ending in `Service`

### Database
- **Use** migrations for schema changes
- **Add** indexes for frequently queried columns
- **Use** foreign keys for referential integrity
- **Follow** Rails naming conventions

## File Organization

### Controllers
```
app/controllers/
├── application_controller.rb
├── admin/
│   ├── base_controller.rb
│   └── [admin_controllers].rb
├── api/
│   └── [api_controllers].rb
└── [feature_controllers].rb
```

### Views
```
app/views/
├── layouts/
├── shared/
├── [feature_name]/
│   ├── _form.html.erb
│   ├── index.html.erb
│   └── show.html.erb
```

### JavaScript
```
app/javascript/
├── controllers/
│   ├── application.js
│   └── [feature_controller].js
├── channels/
└── application.js
```

### Stylesheets
```
app/assets/stylesheets/
├── application.scss
├── components/
├── [feature_name].scss
└── _variables.scss
```

## Code Quality

### Naming Conventions
- **Use** descriptive, self-documenting names
- **Follow** Rails naming conventions
- **Use** camelCase for JavaScript variables and functions
- **Use** snake_case for Ruby methods and variables

### Comments
- **Write** clear, concise comments for complex logic
- **Document** public API methods
- **Explain** business rules and edge cases

### Error Handling
- **Use** proper HTTP status codes
- **Provide** meaningful error messages
- **Handle** edge cases gracefully
- **Log** errors appropriately

## Testing

### RSpec
- **Write** tests for all new features
- **Use** descriptive test names
- **Follow** AAA pattern (Arrange, Act, Assert)
- **Mock** external dependencies

### Test Organization
```
spec/
├── models/
├── controllers/
├── requests/
├── views/
└── helpers/
```

## Security

### Authentication
- **Use** Devise for user authentication
- **Implement** proper authorization with CanCanCan
- **Protect** sensitive routes

### Data Protection
- **Use** strong parameters
- **Validate** all user input
- **Sanitize** output when necessary
- **Use** CSRF protection

## Performance

### Database
- **Use** includes/joins to avoid N+1 queries
- **Add** database indexes for frequently queried columns
- **Use** pagination for large datasets

### Frontend
- **Minimize** JavaScript bundle size
- **Use** lazy loading for images
- **Optimize** CSS delivery

## Deployment

### Environment Configuration
- **Use** environment variables for sensitive data
- **Configure** different settings per environment
- **Use** Rails credentials for secrets

### Monitoring
- **Implement** proper logging
- **Monitor** application performance
- **Set up** error tracking

## Common Patterns

### Stimulus Controller Structure
```javascript
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["element"]
  static values = { config: String }

  connect() {
    // Initialization code
  }

  disconnect() {
    // Cleanup code
  }

  // Action methods
  handleAction(event) {
    // Action implementation
  }
}
```

### Form Handling
```erb
<%= form_with model: @model, local: true, data: { controller: "form" } do |f| %>
  <%= f.text_field :name, data: { action: "change->form#validate" } %>
  <%= f.submit "Save", data: { action: "click->form#submit" } %>
<% end %>
```

### Service Object Pattern
```ruby
class ExampleService
  def initialize(params)
    @params = params
  end

  def call
    # Business logic here
  end

  private

  attr_reader :params
end
```

## Best Practices

1. **Always use Stimulus** for interactive JavaScript
2. **Prefer Bootstrap components** over custom CSS
3. **Write tests** for new functionality
4. **Follow Rails conventions** for file organization
5. **Use service objects** for complex business logic
6. **Keep controllers thin** and focused
7. **Use descriptive names** for variables and methods
8. **Handle errors gracefully** with proper user feedback
9. **Optimize database queries** to avoid N+1 problems
10. **Document complex logic** with clear comments

## Anti-Patterns to Avoid

- ❌ Using raw JavaScript instead of Stimulus
- ❌ Writing custom CSS when Bootstrap classes exist
- ❌ Using manual AJAX/fetch requests instead of Turbo Streams
- ❌ Putting business logic in controllers
- ❌ Ignoring Rails conventions
- ❌ Not handling errors properly
- ❌ Writing untested code
- ❌ Using inline JavaScript in HTML
- ❌ Not using strong parameters
- ❌ Creating fat controllers
- ❌ Not following naming conventions
- ❌ Using JSON responses for UI updates instead of Turbo Streams
- ❌ Making Stimulus controllers handle server communication directly

---

*This document should be updated as the project evolves and new patterns emerge.*