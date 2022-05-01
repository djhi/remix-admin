import { json, LoaderFunction } from "@remix-run/node";
import generateData from "data-generator-retail";
import * as uuid from "uuid";

import { supabaseAdmin } from "~/supabase.server";

const DefaultUser = {
  email: "gildas@marmelab.com",
  password: "password",
};

export const loader: LoaderFunction = async ({ request }) => {
  await addDefaultUser();
  await addGeneratedData();
  return json("ok");
};

const addDefaultUser = async () => {
  try {
    await supabaseAdmin.auth.api.createUser(DefaultUser);
  } catch (error) {
    console.error((error as Error).message);
  }
};

const addGeneratedData = async () => {
  await removeEntityData("review");
  await removeEntityData("invoice");
  await removeEntityData("command");
  await removeEntityData("product");
  await removeEntityData("category");
  await removeEntityData("customer");
  const data = generateData({ serializeDate: true });

  const categories = data.categories.map((category) => ({
    ...category,
    originalId: category.id,
    id: uuid.v4(),
  }));

  await addEntityData(
    "category",
    categories.map(({ originalId, ...category }) => category)
  );

  const products = data.products.map<any>((product) => ({
    ...product,
    originalId: product.id,
    id: uuid.v4(),
    category_id: categories.find(
      (category) => category.originalId === product.category_id
    )?.id,
  }));

  await addEntityData(
    "product",
    products.map(({ originalId, sales, stock, ...product }) => product)
  );

  const customers = data.customers.map<any>((customer) => ({
    ...customer,
    originalId: customer.id,
    id: uuid.v4(),
  }));

  await addUsers(customers);

  const commands = data.commands.map((command) => ({
    ...command,
    originalId: command.id,
    id: uuid.v4(),
    customer_id: customers.find(
      (customer) => customer.originalId === command.customer_id
    )?.id,
    basket: command.basket.map((item: any) => ({
      ...item,
      product_id: products.find(
        (product) => product.originalId === item.product_id
      )?.id,
    })),
  }));

  await addEntityData(
    "command",
    commands.map(({ originalId, ...command }) => command)
  );

  const invoices = data.invoices.map((invoice) => ({
    ...invoice,
    originalId: invoice.id,
    id: uuid.v4(),
    customer_id: customers.find(
      (customer) => customer.originalId === invoice.customer_id
    )?.id,
    command_id: commands.find(
      (command) => command.originalId === invoice.command_id
    )?.id,
  }));

  await addEntityData(
    "invoice",
    invoices.map(({ originalId, ...invoice }) => invoice)
  );

  const reviews = data.reviews.map((review) => ({
    ...review,
    originalId: review.id,
    id: uuid.v4(),
    customer_id: customers.find(
      (customer) => customer.originalId === review.customer_id
    )?.id,
    command_id: commands.find(
      (command) => command.originalId === review.command_id
    )?.id,
    product_id: products.find(
      (product) => product.originalId === review.product_id
    )?.id,
  }));
  await addEntityData(
    "review",
    reviews.map(({ originalId, ...review }) => review)
  );
};

const removeEntityData = async (entity: string) => {
  const { error: deleteError } = await supabaseAdmin
    .from(entity)
    .delete()
    .not("id", "eq", uuid.v4());

  if (deleteError) {
    console.error(deleteError.message);
    throw deleteError;
  }
};
const addEntityData = async (entity: string, dataToInsert: any[]) => {
  console.log(`Adding ${dataToInsert.length} ${entity}`);

  const { error } = await supabaseAdmin
    .from(entity)
    .insert(dataToInsert, { returning: "minimal" });

  if (error) {
    console.error(error.message);
    throw error;
  }
  console.log(`Added ${dataToInsert.length} ${entity}`);
};

const addUsers = async (dataToInsert: any[]) => {
  console.log(`Adding ${dataToInsert.length} user`);
  await Promise.all(
    dataToInsert.map(
      async ({
        originalId,
        latest_purchase,
        groups,
        nb_commands,
        total_spent,
        has_ordered,
        ...customer
      }) => {
        const { user, error } = await supabaseAdmin.auth.api.createUser({
          email: customer.email,
          password: "password",
        });
        if (error) {
          throw error;
        }
        const { error: customerError } = await supabaseAdmin
          .from("customer")
          .insert({
            ...customer,
            user_id: user.id,
          });

        if (customerError) {
          console.error(customerError.message);
          throw customerError;
        }
      }
    )
  );
  console.log(`Added ${dataToInsert.length} users`);
};
