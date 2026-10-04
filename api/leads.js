export default async function handler(req, res) {
  const token = process.env.NOTION_TOKEN;
  let databaseId = process.env.NOTION_DATABASE_ID;

  if (!token || !databaseId) {
    return res.status(500).json({
      error: "Missing NOTION_TOKEN or NOTION_DATABASE_ID"
    });
  }

  // Clean the database ID if a full Notion URL was accidentally pasted
  databaseId = databaseId.trim().replace(/^["']|["']$/g, "");

  const match = databaseId.match(
    /[0-9a-fA-F]{32}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/
  );

  if (match) {
    databaseId = match[0];
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        }
      }
    );

    const data = await response.json();

    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
