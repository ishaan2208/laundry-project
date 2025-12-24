import { prisma } from "../src/lib/db";

async function main() {
  // 6 properties (edit names later)
  const properties = await Promise.all(
    [
      "Rosewood",
      "Limewood",
      "Silverwood",
      "Oakwood",
      "Monte Verde",
      "Cherrywood",
    ].map((name, idx) =>
      prisma.property.upsert({
        where: { code: `H${idx + 1}` },
        update: { name, isActive: true },
        create: { name, code: `H${idx + 1}` },
      })
    )
  );

  // Create three laundry vendors (name is not unique in schema so use findFirst -> update/create)
  const vendorNames = ["Vinay", "Vikas", "Datta"];

  const createdVendors: {
    id: string;
    name: string;
    phone?: string | null;
    isActive: boolean;
  }[] = [];
  for (const name of vendorNames) {
    const existing = await prisma.vendor.findFirst({ where: { name } });
    if (existing) {
      const updated = await prisma.vendor.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
      createdVendors.push(updated);
    } else {
      const created = await prisma.vendor.create({
        data: { name, isActive: true },
      });
      createdVendors.push(created);
    }
  }

  // Create standard locations per property (including vendor location). Assign vendors to properties round-robin.
  for (const [idx, p] of properties.entries()) {
    const vendorForProperty = createdVendors[idx % createdVendors.length];
    const base = [
      { name: "Clean Store", kind: "CLEAN_STORE" as const },
      { name: "Soiled Store", kind: "SOILED_STORE" as const },
      { name: "Rewash Bin", kind: "REWASH_BIN" as const },
      { name: "Damaged Bin", kind: "DAMAGED_BIN" as const },
      { name: "Discarded/Lost", kind: "DISCARDED_LOST" as const },
    ];

    for (const loc of base) {
      await prisma.location.upsert({
        where: { propertyId_name: { propertyId: p.id, name: loc.name } },
        update: { kind: loc.kind, kindKey: loc.kind, isActive: true },
        create: {
          propertyId: p.id,
          name: loc.name,
          kind: loc.kind,
          kindKey: loc.kind,
        },
      });
    }

    await prisma.location.upsert({
      where: {
        propertyId_name: {
          propertyId: p.id,
          name: `Laundry - ${vendorForProperty.name}`,
        },
      },
      update: {
        kind: "VENDOR",
        vendorId: vendorForProperty.id,
        kindKey: `VENDOR:${vendorForProperty.id}`,
        isActive: true,
      },
      create: {
        propertyId: p.id,
        name: `Laundry - ${vendorForProperty.name}`,
        kind: "VENDOR",
        vendorId: vendorForProperty.id,
        kindKey: `VENDOR:${vendorForProperty.id}`,
      },
    });
  }

  // Sample items (edit later)
  await prisma.linenItem.upsert({
    where: { sku: "BEDSHEET" },
    update: { isActive: true },
    create: { name: "Bedsheet", sku: "BEDSHEET" },
  });
  await prisma.linenItem.upsert({
    where: { sku: "PILLOW_COVER" },
    update: { isActive: true },
    create: { name: "Pillow Cover", sku: "PILLOW_COVER" },
  });
  await prisma.linenItem.upsert({
    where: { sku: "BATH_TOWEL" },
    update: { isActive: true },
    create: { name: "Bath Towel", sku: "BATH_TOWEL" },
  });
  await prisma.linenItem.upsert({
    where: { sku: "DUVET_COVER" },
    update: { isActive: true },
    create: { name: "Duvet Cover", sku: "DUVET_COVER" },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
