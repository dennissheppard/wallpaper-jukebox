# Setting up Pixabay Image Source

To use real images from Pixabay instead of the mock placeholders, you need to obtain a free API key.

1.  **Register:** Go to [https://pixabay.com/accounts/register/](https://pixabay.com/accounts/register/) and create a free account.
2.  **Get Key:** Once logged in, go to the [API Documentation](https://pixabay.com/api/docs/). Your API key will be displayed in the **Parameters** section (look for `key`).
3.  **Configure:**
    *   Open your `.env` file in the project root.
    *   Add or update the line:
        ```
        PIXABAY_API_KEY=your_copied_api_key_here
        ```
4.  **Restart:** Restart the development server (`npm run dev`) for the changes to take effect.

Once configured, the "Pixabay" source in the settings menu will return high-quality images matching your search queries.
