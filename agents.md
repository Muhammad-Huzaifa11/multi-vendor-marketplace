# AI Agent Development Guidelines

This document provides comprehensive guidelines for AI agents working on this Rails application. Follow these patterns and conventions to ensure consistent, maintainable code.

## Frontend Development

### JavaScript Framework
- **ALWAYS use Stimulus** for all interactive JavaScript functionality
- **NEVER use raw JavaScript** event listeners or DOM manipulation
- **PREFER Stimulus actions** (`data-action`) over `addEventListener`
- **USE Stimulus targets** (`data-target`) for element references
- **LEVERAGE Stimulus values** (`data-value`) for configuration

### Turbo/Turbo Streams
- **ALWAYS use Turbo Streams** for dynamic content updates instead of AJAX requests
- **PREFER server-side rendering** with Turbo Stream responses
- **NEVER use manual `fetch()`** or `XMLHttpRequest` calls in Stimulus controllers
- **USE `data-turbo-method`** and `data-turbo-confirm` for form submissions
- **LEVERAGE Turbo Frames** for partial page updates

### When to Use Stimulus vs Turbo
- **USE Stimulus for:**
  - Client-side interactions (toggles, animations, form validation)
  - DOM manipulation that doesn't require server data
  - Event handling and user interface state management
- **USE Turbo for:**
  - Server communication and data fetching
  - Dynamic content updates from server
  - Form submissions and page navigation
  - Any operation that requires server-side processing

### CSS Framework
- **ALWAYS use Bootstrap 5** for all UI components
- **PREFER Bootstrap classes** over custom CSS
- **USE SCSS** for custom styling when needed
- **FOLLOW Bootstrap's utility-first** approach

## Backend Development

### Controllers
- **FOLLOW Rails conventions** for controller structure
- **USE strong parameters** for form data
- **IMPLEMENT proper error handling** and flash messages
- **KEEP controllers thin** - move business logic to services

### Models
- **USE ActiveRecord associations** appropriately
- **IMPLEMENT validations** for data integrity
- **CREATE scopes** for common queries
- **USE concerns** for shared functionality

### Services
- **CREATE service objects** for complex business logic
- **PLACE services** in `app/services/`
- **USE descriptive class names** ending in `Service`

### Database
- **USE migrations** for schema changes
- **ADD indexes** for frequently queried columns
- **USE foreign keys** for referential integrity
- **FOLLOW Rails naming conventions**

## Code Quality

### Naming Conventions
- **USE descriptive, self-documenting names**
- **FOLLOW Rails naming conventions**
- **USE camelCase** for JavaScript variables and functions
- **USE snake_case** for Ruby methods and variables

### Comments
- **WRITE clear, concise comments** for complex logic
- **DOCUMENT public API methods**
- **EXPLAIN business rules** and edge cases

### Error Handling
- **USE proper HTTP status codes**
- **PROVIDE meaningful error messages**
- **HANDLE edge cases gracefully**
- **LOG errors appropriately**

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

### Turbo Stream Patterns
```erb
<!-- Good: Use Turbo Streams for dynamic updates -->
<%= form_with model: @item, data: { turbo_stream: true } do |f| %>
  <%= f.submit "Update", data: { turbo_method: :patch } %>
<% end %>

<!-- Good: Use Turbo Frames for partial updates -->
<%= turbo_frame_tag "item_#{@item.id}" do %>
  <!-- Content that can be updated independently -->
<% end %>
```

### Controller Turbo Stream Responses
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

## Anti-Patterns to AVOID

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

## Testing

### RSpec
- **WRITE tests** for all new features
- **USE descriptive test names**
- **FOLLOW AAA pattern** (Arrange, Act, Assert)
- **MOCK external dependencies**

## Security

### Authentication
- **USE Devise** for user authentication
- **IMPLEMENT proper authorization** with CanCanCan
- **PROTECT sensitive routes**

### Data Protection
- **USE strong parameters**
- **VALIDATE all user input**
- **SANITIZE output** when necessary
- **USE CSRF protection**

## Performance

### Database
- **USE includes/joins** to avoid N+1 queries
- **ADD database indexes** for frequently queried columns
- **USE pagination** for large datasets

### Frontend
- **MINIMIZE JavaScript bundle size**
- **USE lazy loading** for images
- **OPTIMIZE CSS delivery**

## Best Practices Summary

1. **ALWAYS use Stimulus** for interactive JavaScript
2. **ALWAYS use Bootstrap** components over custom CSS
3. **ALWAYS use Turbo Streams** instead of manual AJAX
4. **WRITE tests** for new functionality
5. **FOLLOW Rails conventions** for file organization
6. **USE service objects** for complex business logic
7. **KEEP controllers thin** and focused
8. **USE descriptive names** for variables and methods
9. **HANDLE errors gracefully** with proper user feedback
10. **OPTIMIZE database queries** to avoid N+1 problems
11. **DOCUMENT complex logic** with clear comments

## Project-Specific Context

### Current Features
- **Playlist Management**: Uses Bootstrap accordion with Stimulus actions for location/screen selection
- **Media Library**: Integrates with Canva API for design management
- **Ad Campaigns**: Built with Rails conventions and service objects
- **Kiosk Management**: Real-time updates using ActionCable

### Key Models
- `Playlist`: Main content management
- `Store`: Location management
- `Kiosk`: Screen/display management
- `Ad`: Campaign management
- `Media`: File management

### Important Controllers
- `PlaylistsController`: Main CRUD operations
- `StoresController`: Location management
- `AdsController`: Campaign management
- `Admin::*`: Administrative functions

---

*This document should be updated as the project evolves and new patterns emerge.*