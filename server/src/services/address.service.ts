import type { AddressView, CreateAddressInput } from "@stefanmarket/shared";

import { prisma } from "../lib/prisma.js";

function toAddressView(address: {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  county: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}): AddressView {
  return {
    id: address.id,
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    street: address.street,
    city: address.city,
    county: address.county,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
  };
}

export async function listAddresses(userId: string): Promise<AddressView[]> {
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return addresses.map(toAddressView);
}

export async function createAddress(userId: string, input: CreateAddressInput): Promise<AddressView> {
  if (input.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({
    data: {
      userId,
      label: input.label,
      fullName: input.fullName,
      phone: input.phone,
      street: input.street,
      city: input.city,
      county: input.county,
      postalCode: input.postalCode,
      country: input.country ?? "Romania",
      isDefault: input.isDefault ?? false,
    },
  });
  return toAddressView(address);
}
