# AI Chatbot with Smart Actions 🤖

## Overview

Your chatbot now has the ability to help customers **order products**, **book workshops**, and **reserve experiences** directly from the conversation!

## New Features

### 1. **Smart Product Recommendations**

When users ask about pottery items (mugs, bowls, plates, etc.), the chatbot automatically:

- Identifies relevant products from your database
- Shows "Add to Cart" buttons with prices
- Adds items directly to cart with one click

**Example:**

```
User: "I'm looking for a ceramic mug"
Bot: "We have beautiful handcrafted mugs! Here are some options..."
[Add Minimalist Cream Mugs - ₹850] [Add Ocean Blue Mugs - ₹950]
```

### 2. **Workshop Booking**

When users inquire about workshops or classes, the chatbot:

- Fetches available active workshops
- Displays "Book" buttons with pricing
- Adds workshops to cart for checkout

**Example:**

```
User: "Do you have beginner pottery workshops?"
Bot: "Yes! We have several workshops for beginners..."
[Book Beginner Pottery Workshop - ₹2500] [Book Kids Clay Play - ₹1200]
```

### 3. **Experience Reservations**

For studio visits and special experiences:

- Shows "View Experiences" button
- Redirects to experience booking page
- Automatically scrolls to selected experience

**Example:**

```
User: "Can I book a private pottery session?"
Bot: "Absolutely! We offer personalized pottery experiences..."
[View Experiences]
```

## How It Works

### Keyword Detection

The chatbot analyzes messages for specific keywords:

**Products:** mug, bowl, plate, vase, platter, tea set, pottery, sculpture  
**Workshops:** workshop, class, pottery session, wheel throwing, beginner  
**Experiences:** experience, studio visit, pottery date, private session

### Smart Matching

- Fetches real-time data from Supabase
- Matches user intent with available items
- Shows up to 3 relevant options per category

### Action Buttons

Each action button:

- ✅ Shows item name and price
- ✅ Has appropriate icon (🛍️ cart, 📅 calendar, ✨ experience)
- ✅ Works for both guests and logged-in users
- ✅ Provides instant feedback via toast notifications

## User Experience Flow

1. **User asks question** → Chatbot responds with information
2. **Chatbot detects intent** → Fetches matching products/workshops
3. **Action buttons appear** → User clicks to add/book
4. **Instant action** → Item added to cart or redirects to booking page
5. **Visual confirmation** → Toast notification confirms action

## Technical Implementation

### Components Used

- `useCart()` - Cart management
- `useAuth()` - User authentication
- Supabase client - Database queries
- React Router - Navigation

### Database Tables

- `products` - Product catalog
- `workshops` - Workshop listings
- `cart_items` - Shopping cart
- `experience_bookings` - Experience reservations

## Customization

### Add More Keywords

Edit the `parseActionsFromResponse` function in [ChatWidget.tsx](src/components/ChatWidget.tsx#L93):

```typescript
const productKeywords = ["mug", "bowl", "your-new-keyword"];
```

### Change Number of Suggestions

Modify the `.limit()` value:

```typescript
.limit(5) // Show 5 products instead of 3
```

### Customize Button Appearance

Edit the button styling in the action buttons section:

```typescript
className =
  "flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-terracotta...";
```

## Usage Tips

### For Better Results:

1. **Be specific**: "Show me tea sets" works better than "show products"
2. **Ask naturally**: The chatbot understands conversational queries
3. **Combine requests**: "I need a mug and want to book a workshop"

### Example Queries:

- ✅ "What bowls do you have?"
- ✅ "I want to learn pottery for beginners"
- ✅ "Can I book a couple's pottery date?"
- ✅ "Show me your sculptures"
- ✅ "Do you have any workshops this weekend?"

## Integration with Your N8N Workflow

The chatbot still communicates with your N8N webhook for natural language processing. The action buttons are added **client-side** after receiving the response, so no changes to your N8N workflow are needed!

## Benefits

### For Customers:

- 🎯 Faster shopping experience
- 💬 Natural conversation flow
- ⚡ One-click actions
- 📱 Mobile-friendly

### For Your Business:

- 📈 Higher conversion rates
- 🛒 Reduced cart abandonment
- ⏱️ Less customer service load
- 💰 More bookings and sales

## Next Steps

### Potential Enhancements:

1. **Image previews** in chat messages
2. **Quantity selector** for products
3. **Date/time picker** for workshops
4. **Payment** directly in chat
5. **Order tracking** via chat

---

**Need Help?** The chatbot feature is fully integrated and ready to use. Just deploy and watch your conversions grow! 🚀
