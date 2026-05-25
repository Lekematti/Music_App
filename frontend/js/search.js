const createResultItem = (song, index) => {
    const item = document.createElement('list-row-item');
    item.setAttribute('song-id', song.id);
    item.setAttribute('title', song.title);
    item.setAttribute('artist', song.artist);
    item.setAttribute('rank', `${index + 1}.`);

    if (song.imageUrl) {
        item.setAttribute('image', song.imageUrl);
    }

    return item;
};

const renderSearchResults = (container, songs, summary, emptyMessage) => {
    container.innerHTML = '';

    if (summary) {
        const summaryNode = document.getElementById('search-summary');
        if (summaryNode) {
            summaryNode.textContent = summary;
        }
    }

    if (songs.length === 0) {
        container.innerHTML = emptyMessage;
        return;
    }

    songs.forEach((song, index) => {
        container.appendChild(createResultItem(song, index));
    });
};

const getSearchQuery = () => new URLSearchParams(globalThis.location.search).get('q')?.trim() || '';

document.addEventListener('DOMContentLoaded', async () => {
    const resultsList = document.getElementById('search-results');
    const query = getSearchQuery();

    if (!resultsList) {
        return;
    }

    if (!query) {
        renderSearchResults(resultsList, [], 'Enter a song or artist name to search.', '<p style="color: #888;">Type something in the search bar above.</p>');
        return;
    }

    renderSearchResults(resultsList, [], `Searching for “${query}”…`, '<p style="color: #888;">Searching...</p>');

    try {
        const response = await fetch(`/api/songs?search=${encodeURIComponent(query)}`);

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const songs = await response.json();
        renderSearchResults(
            resultsList,
            songs,
            songs.length ? `Found ${songs.length} result${songs.length === 1 ? '' : 's'} for “${query}”.` : `No results found for “${query}”.`,
            '<p style="color: #888;">No songs matched your search.</p>'
        );
    } catch (error) {
        console.error('Error fetching search results:', error);
        renderSearchResults(resultsList, [], `Search failed for “${query}”.`, '<p style="color: red;">Cannot connect to the server.</p>');
    }
});