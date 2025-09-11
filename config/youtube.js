const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));


async function fetchYouTubeVideo(query) {
  const apiKey = process.env.YT_API_KEY;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=2&order=relevance&q=${encodeURIComponent(query + " tutorial")}&key=${apiKey}`;
  
  const res = await fetch(url);
  const data = await res.json();

  if (data.items?.length > 0) {
    return data.items.map(item => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.medium.url,
      channel: item.snippet.channelTitle
    }));
  }

  return [];
}

// 👇 Export so you can import in controller
module.exports = { fetchYouTubeVideo };
