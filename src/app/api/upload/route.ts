import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const folder = (formData.get("folder") as string) || "pkl-izin";

    if (files.length === 0) {
      return NextResponse.json({ error: "Tidak ada file" }, { status: 400 });
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: "Maksimal 5 file" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      folder
    );
    await mkdir(uploadDir, { recursive: true });

    const urls: string[] = [];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} melebihi 10 MB` },
          { status: 400 }
        );
      }

      const ext = path.extname(file.name);
      const filename = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}${ext}`;
      const filePath = path.join(uploadDir, filename);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      urls.push(`/uploads/${folder}/${filename}`);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
