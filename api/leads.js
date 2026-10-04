export default async function handler(req, res) {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID?.trim();

  if (!token || !databaseId) {
    return res.status(500).json({
      error: "Missing Notion environment variables"
    });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Notion-Version": "2026-03-11",
    "Content-Type": "application/json"
  };

  try {
    // Get database information
    const dbResponse = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}`,
      { headers }
    );

    const database = await dbResponse.json();

    if (!dbResponse.ok) {
      return res.status(dbResponse.status).json(database);
    }

    const dataSourceId = database.data_sources?.[0]?.id;

    if (!dataSourceId) {
      return res.status(400).json({
        error: "No data source found"
      });
    }

    // Get the actual rows
    const rowsResponse = await fetch(
      `https://api.notion.com/v1/data_sources/${dataSourceId}/query`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({})
      }
    );

    const rows = await rowsResponse.json();

    if (!rowsResponse.ok) {
      return res.status(rowsResponse.status).json(rows);
    }

    return res.status(200).json(rows.results || []);

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
