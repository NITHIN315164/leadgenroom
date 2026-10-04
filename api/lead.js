export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/data_sources/${process.env.NOTION_DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const leads = data.results.map(page => {
      const p = page.properties;

      return {
        name: p.Name?.title?.[0]?.plain_text || "",
        email: p.Email?.email || "",
        phone: p.Phone?.phone_number || "",
        area:
          p.Area?.rich_text?.[0]?.plain_text ||
          p["Property Interest"]?.rich_text?.[0]?.plain_text ||
          "",
        budget: p.Budget?.rich_text?.[0]?.plain_text || "",
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
      error: "Failed to load leads"
    });
  }
}
