document.addEventListener("DOMContentLoaded", () => {
    const uploadForm = document.getElementById('upload-form');
    if (!uploadForm) {
        return;
    }

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('title').value;
        const artist = document.getElementById('artist').value;
        const audioFile = document.getElementById('audioFile').files[0];
        const imageFile = document.getElementById('imageFile').files[0];
        const messageEl = document.getElementById('upload-message');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
            // Get user token from localStorage
            const token = localStorage.getItem('token');
            
            if (!token) {
                messageEl.innerHTML = '<a href="./login.html" style="color: #1db954; text-decoration: underline;">Please log in</a> to upload music.';
                messageEl.className = "upload-message-error";
                return;
            }

            if (!audioFile) {
                 messageEl.textContent = "Please select an audio file.";
                 messageEl.className = "upload-message-error";
                 return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Uploading...';
            messageEl.textContent = 'Uploading files...';
            messageEl.className = "";

            const formData = new FormData();
            formData.append('title', title);
            formData.append('artist', artist);
            formData.append('audioFile', audioFile);
            if (imageFile) {
                formData.append('imageFile', imageFile);
            }

            const res = await fetch('/api/uploads', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
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
            messageEl.textContent = err.message || "Server error. Please try again later.";
            messageEl.className = "upload-message-error";
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Upload';
        }
    });
});
