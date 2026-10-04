module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!token || !databaseId) {
    return res.status(500).json({
      error: "Missing NOTION_TOKEN or NOTION_DATABASE_ID"
    });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Notion-Version": "2025-09-03",
    "Content-Type": "application/json"
  };

  try {
    // 1. Get the database and its data source ID
    const databaseResponse = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}`,
      {
        method: "GET",
        headers
      }
    );

    const database = await databaseResponse.json();

    if (!databaseResponse.ok) {
      return res.status(databaseResponse.status).json(database);
    }

    const dataSourceId = database.data_sources?.[0]?.id;

    if (!dataSourceId) {
      return res.status(400).json({
        error: "No Notion data source found for this database"
      });
    }

    // 2. Query the data source
    const response = await fetch(
      `https://api.notion.com/v1/data_sources/${dataSourceId}/query`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({})
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // 3. Convert Notion rows into dashboard data
    const leads = (data.results || []).map((page) => {
      const p = page.properties || {};

      return {
        name: p.Name?.title?.[0]?.plain_text || "",
        email: p.Email?.email || "",
        phone: p.Phone?.phone_number || "",
        area:
          p.Area?.rich_text?.[0]?.plain_text ||
          p["Property Interest"]?.rich_text?.[0]?.plain_text ||
          "",
        budget:
          p.Budget?.rich_text?.[0]?.plain_text ||
          "",
        status:
          p.Status?.status?.name ||
          p.Status?.select?.name ||
          "New",
        date:
          p.Date?.date?.start ||
          page.created_time ||
          ""
      };
    });

    return res.status(200).json(leads);

  } catch (error) {
    return res.status(500).json({
      error: "Failed to load leads",
      details: error.message
    });
  }
};
