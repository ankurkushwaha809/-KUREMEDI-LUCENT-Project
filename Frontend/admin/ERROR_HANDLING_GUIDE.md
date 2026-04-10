# Admin Application Error Handling Guide

## Overview
The admin application now has comprehensive error handling that provides meaningful error messages instead of generic alerts.

## Error Handler Utility
Located: `src/utils/errorHandler.js`

### Functions Available

#### `getErrorMessage(error)`
Extracts the actual error message from various error types and formats them for display to users.

**Returns:** A user-friendly error message string

**Examples of error messages it extracts:**
- `"Category name is required."` - Validation error from backend
- `"Unauthorized: Please log in again"` - 401 HTTP error
- `"Request too large: File size exceeds maximum allowed"` - 413 HTTP error
- `"Image upload failed: Network Error"` - Network error with context

#### `formatErrorDisplay(error, maxLength)`
Formats error for display and truncates very long messages (default 200 chars).

#### `logError(context, error)`
Logs error with full debugging context to browser console.

---

## Error Names & Types

### Validation Errors
| Error | HTTP Status | Cause | Solution |
|-------|------------|-------|----------|
| Product name is required | 400 | Missing product name | Fill in product name field |
| Category is required | 400 | No category selected | Select a category |
| Brand is required | 400 | No brand selected | Select a brand |
| Selling price is required and must be a valid number | 400 | Invalid selling price | Enter a valid number |
| MRP is required and must be a valid number | 400 | Invalid MRP | Enter a valid number |
| Selling price cannot be greater than MRP | 400 | Incorrect pricing | Fix pricing logic |
| Discount must be between 0 and 100 | 400 | Invalid discount | Enter 0-100 |
| GST must be 0 or greater | 400 | Negative GST | Enter positive or 0 |
| Maximum 6 images allowed | 400 | Too many images | Remove excess images |
| Category name is required | 400 | Empty category name | Enter category name |
| Description is required | 400 | Missing description | Add description |
| Brand name is required | 400 | Empty brand name | Enter brand name |

### Authentication Errors
| Error | HTTP Status | Cause | Solution |
|-------|------------|-------|----------|
| Invalid email or password | 401 | Wrong credentials | Check email/password |
| Unauthorized: Please log in again | 401 | Session expired | Login again |
| Forbidden: You don't have permission | 403 | No admin role | Contact administrator |

### Resource Errors
| Error | HTTP Status | Cause | Solution |
|-------|------------|-------|----------|
| Not Found: The requested resource does not exist | 404 | Resource deleted or wrong ID | Refresh page and try again |
| Conflict: This resource already exists | 409 | Duplicate name/entry | Use different name |

### File Upload Errors
| Error | HTTP Status | Cause | Solution |
|-------|------------|-------|----------|
| Request too large: File size exceeds maximum allowed | 413 | Images > 50MB total | Reduce image sizes or count |
| Image upload failed: Network Error | 500 | Cloudinary connection issue | Check internet, retry |
| Failed to upload images to cloud storage | 500 | Cloudinary misconfiguration | Contact support |

### Server Errors
| Error | HTTP Status | Cause | Solution |
|-------|------------|-------|----------|
| Server Error: | 500 | Backend crashed/error | Check backend logs |
| Service Unavailable: Bad Gateway | 502 | API server down | Wait and retry |
| Service Unavailable: Server temporarily unavailable | 503 | Maintenance mode | Wait, server is updating |
| Gateway Timeout: Request took too long | 504 | Server not responding | Check internet, retry |
| Request timeout: The server is not responding | TIMEOUT | Network/server congestion | Check connection, retry |

### Network Errors
| Error | Type | Cause | Solution |
|-------|------|-------|----------|
| Network Error: Unable to connect to the server | No connection | Internet down or no API access | Check internet connection |
| JSON parsing failed | PARSE_ERROR | Bad response format | Restart app, check backend |

---

## Updated Components

### AddProductModal.jsx
**Changes:**
- Removed generic `alert("Action failed. Please try again.")`
- Added `errorMsg` and `successMsg` state
- Shows detailed error messages in red banner with icon
- Shows success message in green banner
- Uses `getErrorMessage()` from error handler

**Error Display:**
- Top of form, dismissible
- Shows actual backend error messages
- Logs errors to console with context

### AddCategory.jsx
**Changes:**
- Replaced alert dialogs with state-based error handling
- Added error/success message display in dialog
- Uses error handler utility
- Manages dialog open state properly

**Error Display:**
- Inside dialog, inline message
- Shows validation and API errors

### AddBrand.jsx
**Changes:**
- Similar updates to AddCategory
- Error/success messages in dialog
- Proper error extraction from response

**Error Display:**
- Inside dialog, inline message

---

## Usage Examples

### In Components
```javascript
import { getErrorMessage, logError } from "../utils/errorHandler";

try {
  const res = await createProductWithFormData(fd);
  setSuccessMsg("Product created!");
  // ... close modal, refresh list
} catch (error) {
  const errorMessage = getErrorMessage(error);
  setErrorMsg(errorMessage);
  logError("Product creation", error);
}
```

### Error Message Display
```jsx
{errorMsg && (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
    <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
    <p className="text-red-700 text-sm whitespace-pre-wrap">{errorMsg}</p>
  </div>
)}
```

---

## HTTP Status Mapping

| Status | Name | Meaning |
|--------|------|---------|
| 400 | Bad Request | Input validation failed |
| 401 | Unauthorized | Not authenticated/expired token |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 413 | Payload Too Large | File too big |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limited |
| 500 | Internal Server Error | Backend error |
| 502 | Bad Gateway | API server down |
| 503 | Service Unavailable | Maintenance |
| 504 | Gateway Timeout | Request too slow |

---

## Testing Error Handling

### To test validation errors:
1. Open Add Product modal
2. Try to submit with empty fields
3. Should see specific error messages for each field

### To test network errors:
1. Disconnect internet
2. Try to create product
3. Should see network error message

### To test file size error:
1. Try to upload files totaling > 50MB
2. Should see size error

### To test server errors:
1. Stop backend server
2. Try any action
3. Should see "Server not responding" or similar

---

## Future Improvements
- [ ] Add error codes (e.g., ERR_VALIDATION_001)
- [ ] Create error dictionary with solutions
- [ ] Add retry mechanism for transient errors
- [ ] Implement error reporting to analytics
- [ ] Toast notifications for errors
- [ ] Auto-refresh on 401 to get new token
