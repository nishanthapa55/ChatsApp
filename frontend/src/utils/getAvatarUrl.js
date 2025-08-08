const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getAvatarUrl = (avatarPath, seed) => {
    if (avatarPath) {
        // If the path already contains http, it's a full URL (like from Google Login)
        if (avatarPath.startsWith('http')) {
            return avatarPath;
        }
        // Otherwise, it's a local path from our uploads
        return `${BACKEND_URL}${avatarPath}`;
    }
    // Return a consistent placeholder avatar based on a seed (like username or ID)
    return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
};

export default getAvatarUrl;