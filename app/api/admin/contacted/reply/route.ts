import { NextRequest, NextResponse } from "next/server";
import Contact from "@/models/Contact";
import { connectToDatabase } from "@/lib/mongodb";
import { sendMailToContactedUser } from "@/lib/utils/send-mail";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { contactId, message } = await request.json();
    if (!contactId || !message) {
      return NextResponse.json(
        { error: "Missing contactId or message" },
        { status: 400 }
      );
    }
    const contact = await Contact.findById(contactId);
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }
    // Send mail
    await sendMailToContactedUser({
      to: contact.email,
      name: `${contact.firstName} ${contact.lastName}`,
      subject: `Resolved : ${contact.subject}`,
      message,
    });
    // Update status
    await Contact.findByIdAndUpdate(contactId, { status: "replied" });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to send reply" },
      { status: 500 }
    );
  }
}
