import { formatDuration, formatDate } from './utils';
import { MasterData } from '../types';

export function getChangeLog(): string[] {
  return [
    '20.09.2025 - Complete backend rewrite, new UI',
    '28.09.2022 - Add timestamp to show the last time data was updated',
    "25.01.2022 - Identify users by profile's 'display_name' attribute instead of the potentially incomprehensible user id",
    '30.05.2021 - Added UTF-8 support to properly render umlauts, skandic characters, etc',
  ];
}

export function generateHtml(data: { metadata: any; users: MasterData; duplicates: any[] }): string {
  const { metadata, users, duplicates } = data;
  const lastUpdated = formatDate(metadata.lastUpdated);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.playlistName} - Playlist Statistics</title>
    <style>
        :root {
            /* Background Colors */
            --bg-primary: #191414;
            --bg-secondary: #282828;
            --bg-tertiary: #333333;
            --bg-quaternary: #1a1a1a;
            
            /* Text Colors */
            --text-primary: #ffffff;
            --text-secondary: #b3b3b3;
            
            /* Brand Colors */
            --spotify-green: #1DB954;
            --spotify-green-hover: #1ed760;
            
            /* Accent Colors */
            --accent-red: #ff6b6b;
            
            /* Border Colors */
            --border-primary: #404040;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Circular', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
            min-height: 100vh;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: var(--bg-secondary);
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 10px;
            min-height: 120px;
        }
        
        
        .playlist-info h1 {
            font-size: 2.5rem;
            font-weight: 900;
            margin-bottom: 10px;
            color: var(--spotify-green);
            text-align: center;
        }
        
        .playlist-info p {
            font-size: 1.1rem;
            opacity: 0.9;
            margin-bottom: 20px;
        }
        
        .last-updated-header {
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-bottom: 20px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-primary);
        }
        
        .stat-number.duplicates-red {
            color: var(--accent-red);
        }
        
        .stat-number.duplicates-green {
            color: var(--spotify-green);
        }
        
        .user-stat-number.songs-red {
            color: var(--accent-red);
        }
        
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .user-section {
            margin-bottom: 10px;
        }
        
        .user-header {
            background: var(--bg-secondary);
            padding: 12px 20px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center; /* Center vertically */
            flex-wrap: nowrap; /* Prevent wrapping */
            gap: 15px;
            cursor: pointer;
            user-select: none;
            min-height: 60px; /* Reduced height */
            min-width: 100%; /* Ensure full width */
        }
        
        .user-header:hover {
            background: var(--bg-tertiary);
        }
        
        .expand-icon {
            font-size: 1.2rem;
            margin-left: 10px;
            transition: transform 0.3s ease;
        }
        
        .user-header.expanded .expand-icon {
            transform: rotate(90deg);
        }
        
        .tracks-table {
            display: none;
        }
        
        .user-header.expanded + .tracks-table {
            display: table;
        }
        
        .user-name {
            font-size: 1.2rem;
            font-weight: 700;
            flex-shrink: 1; /* Allow username to shrink if needed */
            min-width: 0; /* Allow text truncation */
        }
        
        .user-stats {
            display: flex;
            gap: 10px;
            flex-shrink: 0; /* Prevent stats from shrinking */
        }
        
        .user-stat {
            text-align: center;
        }
        
        .user-stat-number {
            font-size: 1.3rem;
            font-weight: 600;
            color: var(--spotify-green);
        }
        
        .user-stat-label {
            font-size: 0.8rem;
            opacity: 0.7;
        }
        
        .tracks-table {
            width: 100%;
            background: var(--bg-secondary);
            border-radius: 0 0 8px 8px;
            overflow: hidden;
        }
        
        .tracks-table th {
            background: var(--spotify-green);
            color: var(--text-primary);
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
            cursor: pointer;
            user-select: none;
            position: relative;
        }
        
        .tracks-table th:hover {
            background: var(--spotify-green-hover);
        }
        
        
        .tracks-table td {
            padding: 12px;
            border-bottom: 1px solid var(--border-primary);
        }
        
        .tracks-table tr:hover {
            background: var(--bg-quaternary);
        }
        
        .track-name {
            font-weight: 400;
            color: var(--text-primary);
        }
        
        .track-artist {
            color: var(--text-primary);
            font-size: 0.9rem;
        }
        
        .track-album {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .track-duration {
            color: var(--text-secondary);
            font-family: monospace;
        }
        
        .track-date {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .duplicates-section {
            background: var(--bg-secondary);
            border-radius: 8px;
            padding: 20px;
            margin-top: 10px;
        }
        
        .duplicates-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 20px;
            color: var(--accent-red);
        }
        
        .duplicate-item {
            background: var(--bg-quaternary);
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
            border-left: 4px solid var(--accent-red);
        }
        
        .duplicate-song {
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .duplicate-artist {
            color: var(--text-secondary);
            margin-bottom: 10px;
        }
        
        .duplicate-users {
            font-size: 0.9rem;
        }
        
        .duplicate-user {
            background: var(--bg-secondary);
            padding: 4px 8px;
            border-radius: 12px;
            margin: 2px;
            display: inline-block;
        }
        
        .last-updated {
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid var(--bg-secondary);
        }
        
        .changelog-section {
            background: var(--bg-secondary);
            border-radius: 8px;
            padding: 20px;
            margin-top: 10px;
        }
        
        .changelog-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 20px;
            color: var(--spotify-green);
        }
        
        .changelog-list {
            list-style: none;
            padding: 0;
        }
        
        .changelog-list li {
            padding: 8px 0;
            border-bottom: 1px solid var(--bg-secondary);
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .changelog-list li:last-child {
            border-bottom: none;
        }
        
        @media (max-width: 768px) {
            .header {
                text-align: center;
            }
            
            .playlist-info h1 {
                font-size: 2rem;
            }
            
            .user-stats {
                justify-content: center;
            }
            
            .tracks-table {
                font-size: 0.9rem;
            }
            
            .tracks-table th,
            .tracks-table td {
                padding: 8px 6px;
            }
        }
        
        @media (max-width: 485px) {
            .user-header {
                padding: 10px 15px;
                gap: 10px;
            }
            
            .user-name {
                font-size: 1rem;
            }
            
            .user-stats {
                gap: 15px;
            }
            
            .user-stat-number {
                font-size: 1rem;
            }
            
            .user-stat-label {
                font-size: 0.7rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="playlist-info">
                <h1>${metadata.playlistName}</h1>
                <div class="last-updated-header">Last updated: ${lastUpdated}</div>
                <div class="stats-grid">
                    <div class="stat">
                        <div class="stat-number">${metadata.totalSongs}</div>
                        <div class="stat-label">Total Songs</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${metadata.userCount}</div>
                        <div class="stat-label">Contributors</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${metadata.totalDuration}</div>
                        <div class="stat-label">Duration</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number ${metadata.duplicatesFound > 0 ? 'duplicates-red' : 'duplicates-green'}">${metadata.duplicatesFound}</div>
                        <div class="stat-label">Duplicates</div>
                    </div>
                </div>
            </div>
        </div>
        
        ${Object.entries(users)
          .sort(([, a], [, b]) => (b as any).songCount - (a as any).songCount)
          .map(
            ([userId, userData]) => `
            <div class="user-section">
                <div class="user-header" onclick="toggleTable(this)">
                    <div class="user-name">${(userData as any).displayName}<span class="expand-icon">▶</span></div>
                    <div class="user-stats">
                        <div class="user-stat">
                            <div class="user-stat-number ${(userData as any).songCount > 50 ? 'songs-red' : ''}">${(userData as any).songCount}</div>
                            <div class="user-stat-label">Songs</div>
                        </div>
                        <div class="user-stat">
                            <div class="user-stat-number">${formatDuration((userData as any).totalLenghtMs)}</div>
                            <div class="user-stat-label">Duration</div>
                        </div>
                    </div>
                </div>
                <table class="tracks-table">
                    <thead>
                        <tr>
                            <th onclick="sortTable(this, 0)">Track</th>
                            <th onclick="sortTable(this, 1)">Artist</th>
                            <th onclick="sortTable(this, 2)">Album</th>
                            <th onclick="sortTable(this, 3)">Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(userData as any).tracks
                          .map(
                            (track: any) => `
                            <tr>
                                <td class="track-name">${track.name}</td>
                                <td class="track-artist">${track.artist}</td>
                                <td class="track-album">${track.album}</td>
                                <td class="track-duration">${track.durationTimestamp}</td>
                            </tr>
                        `,
                          )
                          .join('')}
                    </tbody>
                </table>
            </div>
            `,
          )
          .join('')}
        
        ${
          duplicates.length > 0
            ? `
        <div class="duplicates-section">
            <h2 class="duplicates-title">🔄 Duplicate Songs</h2>
            ${duplicates
              .map(
                (dupe: any) => `
                <div class="duplicate-item">
                    <div class="duplicate-song">${dupe.song}</div>
                    <div class="duplicate-artist">by ${dupe.artist}</div>
                    <div class="duplicate-users">
                        Added by: ${dupe.addedBy
                          .map(
                            (entry: any) => `
                            <span class="duplicate-user">${entry.user} (${formatDate(entry.AddedAt)})</span>
                        `,
                          )
                          .join('')}
                    </div>
                </div>
            `,
              )
              .join('')}
        </div>
        `
            : ''
        }
        
        <div class="changelog-section">
            <h2 class="changelog-title">📝 Changelog</h2>
            <ul class="changelog-list">
                ${getChangeLog()
                  .map((entry) => `<li>${entry}</li>`)
                  .join('')}
            </ul>
        </div>
    </div>
    
    <script>
        function toggleTable(header) {
            header.classList.toggle('expanded');
        }
        
        function sortTable(header, columnIndex) {
            const table = header.closest('table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const isAscending = header.classList.contains('sorted-asc');
            
            // Clear all sort classes
            table.querySelectorAll('th').forEach(th => {
                th.classList.remove('sorted-asc', 'sorted-desc');
            });
            
            // Set new sort class
            header.classList.add(isAscending ? 'sorted-desc' : 'sorted-asc');
            
            // Sort rows
            rows.sort((a, b) => {
                const aText = a.cells[columnIndex].textContent.trim();
                const bText = b.cells[columnIndex].textContent.trim();
                
                // Handle duration sorting (convert to seconds)
                if (columnIndex === 3) {
                    const aSeconds = parseDuration(aText);
                    const bSeconds = parseDuration(bText);
                    return isAscending ? bSeconds - aSeconds : aSeconds - bSeconds;
                }
                
                // Default text sorting
                return isAscending ? bText.localeCompare(aText) : aText.localeCompare(bText);
            });
            
            // Reorder rows in DOM
            rows.forEach(row => tbody.appendChild(row));
        }
        
        function parseDuration(duration) {
            const parts = duration.split(':');
            if (parts.length === 2) {
                return parseInt(parts[0]) * 60 + parseInt(parts[1]);
            } else if (parts.length === 3) {
                return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
            }
            return 0;
        }
    </script>
</body>
</html>`;
}
