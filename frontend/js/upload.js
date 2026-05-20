document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('upload-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('title').value;
        const artist = document.getElementById('artist').value;
        const url = document.getElementById('url').value;
        const imageUrl = document.getElementById('imageUrl').value || null;
        const messageEl = document.getElementById('upload-message');

        try {
            // Get user token from localStorage
            const token = localStorage.getItem('token');
            
            if (!token) {
                messageEl.innerHTML = '<a href="./login.html" style="color: #1db954; text-decoration: underline;">Please log in</a> to upload music.';
                messageEl.className = "upload-message-error";
                return;
            }

            const res = await fetch('/api/songs', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, artist, url, imageUrl })
            });

            if (res.ok) {
                messageEl.textContent = "Song uploaded successfully!";
                messageEl.className = "upload-message-success";
                document.getElementById('upload-form').reset();
            } else {
                const data = await res.json();
                messageEl.textContent = data.message || "Upload failed.";
                messageEl.className = "upload-message-error";
            }
        } catch (err) {
            console.error(err);
            messageEl.textContent = "Server error. Please try again later.";
            messageEl.className = "upload-message-error";
        }
    });
});
