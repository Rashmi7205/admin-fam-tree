import { connectToDatabase } from "../lib/mongodb";
import Admin from "@/models/Admin";

async function createAdmin() {
  try {
    await connectToDatabase();

    const email = process.argv[2] || "admin@familytree.com";
    const password = process.argv[3] || "Admin@123";
    const firstName = process.argv[4] || "Super";
    const lastName = process.argv[5] || "Admin";
    const role = process.argv[6] || "super_admin";

    console.log("Creating admin with:", { email, firstName, lastName, role });

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log("Admin already exists, updating password...");
      existingAdmin.passwordHash = password; // Store plain password
      await existingAdmin.save();
      console.log("Admin password updated successfully");
      return;
    }

    const admin = await Admin.create({
      email,
      passwordHash: password, // Store plain password
      firstName,
      lastName,
      role,
      isActive: true,
    });

    console.log("Admin created successfully:", {
      _id: admin._id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

createAdmin();
