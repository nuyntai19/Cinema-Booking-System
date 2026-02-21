# 🎬 FRONTEND INTEGRATION GUIDE - Galaxy Cinema

## 📋 Overview

This guide explains how to use the backend APIs in your React frontend application.

---

## ✅ What's Been Implemented

### 1. **API Infrastructure**
- ✅ [api-config.ts](src/lib/api-config.ts) - API endpoints configuration
- ✅ [api-client.ts](src/lib/api-client.ts) - HTTP client with auth handling
- ✅ [api.ts](src/types/api.ts) - TypeScript types for API responses

### 2. **Services**
- ✅ [ticket.service.ts](src/services/ticket.service.ts) - Ticket API methods
- ✅ [concession.service.ts](src/services/concession.service.ts) - Concession API methods

### 3. **Components**
- ✅ [TicketChecker.tsx](src/components/staff/TicketChecker.tsx) - QR scanner for staff
- ✅ [ConcessionsPage.tsx](src/pages/booking/ConcessionsPage.tsx) - Updated to fetch from API

---

## 🚀 Quick Start

### 1. Setup Environment

Create a `.env` file in the frontend root:

```bash
cp .env.example .env
```

Update the API URL:
```env
VITE_API_URL=http://localhost:8000/api
```

### 2. Start Backend Server

```bash
cd backend
php -S localhost:8000
```

### 3. Start Frontend Dev Server

```bash
cd source-code/galaxy-cinema-hub-main
npm install
npm run dev
```

---

## 📚 API Usage Examples

### Using Ticket Service

```typescript
import { TicketService } from '@/services/ticket.service';
import { ApiError } from '@/lib/api-client';

// Get ticket by QR code
const getTicket = async (code: string) => {
  try {
    const response = await TicketService.getByCode(code);
    if (response.success) {
      console.log('Ticket:', response.data);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('Error:', error.message);
    }
  }
};

// Check ticket at gate (Staff)
const checkTicket = async (code: string) => {
  try {
    const response = await TicketService.checkTicket({ code });
    if (response.success) {
      // Ticket is valid - allow entry
      console.log('Valid ticket:', response.data?.ticket);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      // Handle different error cases
      if (error.statusCode === 400) {
        // Ticket not valid (wrong status, too early, etc.)
        console.error(error.message);
      }
    }
  }
};

// Get tickets for a booking
const getBookingTickets = async (bookingId: string) => {
  const response = await TicketService.getByBooking(bookingId);
  return response.data; // Array of tickets
};

// Refund a ticket
const refundTicket = async (ticketId: string) => {
  try {
    const response = await TicketService.refund(ticketId);
    if (response.success) {
      console.log('Refunded amount:', response.data?.refundAmount);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(error.message);
    }
  }
};
```

### Using Concession Service

```typescript
import { ConcessionService } from '@/services/concession.service';

// Get all available concessions
const loadConcessions = async () => {
  try {
    const response = await ConcessionService.getAvailable();
    if (response.success && response.data) {
      setItems(response.data);
    }
  } catch (error) {
    console.error('Failed to load concessions');
  }
};

// Get concession details
const getConcession = async (id: string) => {
  const response = await ConcessionService.getById(id);
  return response.data;
};

// Create new concession (Manager only)
const createConcession = async () => {
  const response = await ConcessionService.create({
    name: 'Combo XL',
    price: 120000,
    category: 'Combo',
    isAvailable: true,
  });
  
  if (response.success) {
    console.log('Created:', response.data);
  }
};

// Update concession
const updateConcession = async (id: string) => {
  const response = await ConcessionService.update(id, {
    price: 115000,
    isAvailable: true,
  });
};

// Delete concession
const deleteConcession = async (id: string) => {
  const response = await ConcessionService.delete(id);
};
```

---

## 🔐 Authentication

The API client automatically handles JWT tokens:

```typescript
import { apiClient } from '@/lib/api-client';

// After successful login, save token
const login = async (email: string, password: string) => {
  const response = await fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (data.success && data.data.token) {
    // Save token
    apiClient.setAuthToken(data.data.token);
    // Token will be automatically included in subsequent requests
  }
};

// Logout
const logout = () => {
  apiClient.clearAuthToken();
};
```

---

## 🎨 Component Integration

### Using TicketChecker Component

```tsx
import TicketChecker from '@/components/staff/TicketChecker';

// In your Staff page
const StaffPage = () => {
  return (
    <div>
      <h1>Staff - Ticket Checking</h1>
      <TicketChecker 
        onSuccess={(ticket) => {
          console.log('Ticket checked:', ticket);
          // Optional: Show success notification
        }}
      />
    </div>
  );
};
```

### Updated ConcessionsPage

The ConcessionsPage now automatically fetches concessions from the API:

```tsx
// No changes needed - it automatically fetches from backend
// Shows loading state while fetching
// Shows error message if fetch fails
// Displays concessions when loaded
```

---

## 📝 Creating New API Services

Follow this pattern to create new services:

```typescript
// src/services/movie.service.ts
import { apiClient, ApiResponse } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';

export class MovieService {
  static async getAll(): Promise<ApiResponse<Movie[]>> {
    return apiClient.get<Movie[]>(API_ENDPOINTS.MOVIES.LIST);
  }
  
  static async getById(id: string): Promise<ApiResponse<Movie>> {
    return apiClient.get<Movie>(API_ENDPOINTS.MOVIES.DETAIL(id));
  }
  
  static async create(data: CreateMovieRequest): Promise<ApiResponse<Movie>> {
    return apiClient.post<Movie>(API_ENDPOINTS.MOVIES.CREATE, data);
  }
}
```

---

## 🔄 Updating Existing Pages

### Pattern 1: Fetch on Component Mount

```typescript
import { useEffect, useState } from 'react';
import { ConcessionService } from '@/services/concession.service';

const MyComponent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await ConcessionService.getAvailable();
        
        if (response.success && response.data) {
          setData(response.data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* Render data */}</div>;
};
```

### Pattern 2: Fetch on User Action

```typescript
const handleCheckTicket = async (code: string) => {
  setLoading(true);
  
  try {
    const response = await TicketService.checkTicket({ code });
    
    if (response.success) {
      toast.success('Vé hợp lệ!');
    }
  } catch (error) {
    if (error instanceof ApiError) {
      toast.error(error.message);
    }
  } finally {
    setLoading(false);
  }
};
```

---

## 🛠️ Pages to Update

Here are the pages that should be updated to use real APIs:

### High Priority

1. **BookingHistoryPage.tsx**
   - Fetch bookings from API
   - Use `TicketService.getByBooking()` to get tickets

2. **HomePage.tsx**
   - Fetch movies from API
   - Use MovieService (needs to be created)

3. **MovieDetailPage.tsx**
   - Fetch movie details from API
   - Fetch showtimes from API
   - Fetch reviews from API

4. **SeatSelectionPage.tsx**
   - Fetch showtime and available seats from API
   - Use ShowtimeService (needs to be created)

5. **PaymentPage.tsx**
   - Create booking via API
   - Process payment
   - Handle success/failure

### Medium Priority

6. **CinemasPage.tsx / CinemasListPage.tsx**
   - Fetch cinemas from API

7. **SchedulePage.tsx**
   - Fetch showtimes from API

8. **ProfilePage.tsx**
   - Fetch user profile from API
   - Update profile via API

### Low Priority (Staff/Admin)

9. **Staff pages**
   - Already have TicketChecker component
   - Can add more staff features

10. **Admin pages**
    - Manage movies, showtimes, concessions
    - View reports

---

## 🧪 Testing Integration

### Manual Testing Steps

1. **Start Backend:**
   ```bash
   cd backend
   php -S localhost:8000
   ```

2. **Start Frontend:**
   ```bash
   cd source-code/galaxy-cinema-hub-main
   npm run dev
   ```

3. **Test Concessions Page:**
   - Navigate to `/booking/concessions`
   - Should see loading spinner
   - Should display concessions from database
   - Try adding/removing items

4. **Test Ticket Checker (Staff):**
   - Open browser console
   - Import and use component
   - Try checking ticket with code from database

### Using Browser Console

```javascript
// Test API directly in console
const testAPI = async () => {
  const response = await fetch('http://localhost:8000/api/concessions/available');
  const data = await response.json();
  console.log(data);
};

testAPI();
```

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Error

**Problem:** Browser blocks requests to backend

**Solution:** Backend already has CORS headers. Make sure backend is running.

### Issue 2: "Route not found"

**Problem:** API endpoint doesn't exist

**Solution:** Check that route is registered in backend `index.php`

### Issue 3: 401 Unauthorized

**Problem:** Missing or invalid JWT token

**Solution:** 
```typescript
// Make sure user is logged in and token is set
import { apiClient } from '@/lib/api-client';
apiClient.setAuthToken(yourToken);
```

### Issue 4: Network Error

**Problem:** Can't connect to backend

**Solution:** 
- Ensure backend is running on port 8000
- Check VITE_API_URL in `.env` file
- Try accessing `http://localhost:8000/api/health` in browser

---

## 📦 Next Steps

1. **Create .env file** with your API URL
2. **Test ConcessionsPage** - Already integrated!
3. **Use TicketChecker** in staff pages
4. **Update other pages** following the patterns above
5. **Create additional services** as needed (MovieService, BookingService, etc.)

---

## 🎯 Example: Complete Page Integration

Here's a complete example of updating a page:

```typescript
// src/pages/MyPage.tsx
import React, { useEffect, useState } from 'react';
import { ConcessionService } from '@/services/concession.service';
import { Concession } from '@/types/api';
import { ApiError } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MyPage: React.FC = () => {
  const [items, setItems] = useState<Concession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await ConcessionService.getAvailable();
        
        if (response.success && response.data) {
          setItems(response.data);
        } else {
          setError('Không thể tải dữ liệu');
        }
      } catch (err) {
        const error = err as ApiError;
        setError(error.message);
        toast({
          title: 'Lỗi',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-3">Đang tải...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <h1>My Page</h1>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
};

export default MyPage;
```

---

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Check backend logs
3. Verify API endpoint exists in backend
4. Test API endpoint with Postman first
5. Check network tab in browser DevTools

---

**Happy Coding! 🚀**
