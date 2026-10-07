import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

// Charger le service réel avec des doubles : aucun accès réseau, paiement ou e-mail réel.
const sourcePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../lib/course-delivery.ts",
);
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const enums = Object.fromEntries(
  [
    "DeliveryStatus",
    "DeliveryType",
    "EnrollmentStatus",
    "OrderStatus",
    "PaymentStatus",
  ].map((name) => [
    name,
    Object.fromEntries(
      [
        "PAID",
        "PENDING",
        "PROCESSING",
        "SENT",
        "FAILED",
        "ACTIVE",
        "REVOKED",
        "PURCHASE_EMAIL",
      ].map((value) => [value, value]),
    ),
  ]),
);

function setup() {
  const course = {
    id: "course-1",
    title: "Formation",
    privateAccessUrl: null,
    privatePdfPath: null,
    privatePdfName: null,
    files: [
      {
        id: "file-1",
        type: "PDF",
        name: "guide.pdf",
        path: "private/guide.pdf",
        mimeType: "application/pdf",
        size: 10,
        position: 0,
      },
      {
        id: "file-2",
        type: "ZIP",
        name: "projet.zip",
        path: "private/projet.zip",
        mimeType: "application/zip",
        size: 20,
        position: 1,
      },
    ],
  };
  const order = {
    id: "order-1",
    reference: "REF-1",
    userId: "user-1",
    status: "PAID",
    totalAmount: 5000,
    currency: "XOF",
    customerFirstName: "Ada",
    customerLastName: null,
    customerEmail: " ADA@EXAMPLE.COM ",
    items: [
      {
        id: "item-1",
        courseId: course.id,
        courseTitle: course.title,
        unitPrice: 5000,
        quantity: 1,
        totalAmount: 5000,
        currency: "XOF",
        course,
      },
    ],
  };
  const payment = {
    id: "payment-1",
    orderId: order.id,
    reference: "PAY-1",
    status: "PAID",
    amount: 5000,
    currency: "XOF",
    paidAt: new Date(),
  };
  const state = {
    order,
    payment,
    course,
    delivery: null,
    enrollment: null,
    emails: [],
    signed: [],
    enrollmentWrites: [],
    emailError: null,
    storageError: null,
  };
  const db = {
    order: { findUnique: async () => order },
    payment: { findUnique: async () => payment },
    enrollment: {
      findUnique: async () => state.enrollment,
      create: async ({ data }) => {
        state.enrollmentWrites.push(data);
        return (state.enrollment = { id: "enrollment-1", ...data });
      },
      update: async ({ data }) => {
        state.enrollmentWrites.push(data);
        Object.assign(state.enrollment, data);
        return state.enrollment;
      },
    },
    courseDelivery: {
      findFirst: async ({ where }) =>
        state.delivery &&
        (typeof where.status === "string"
          ? state.delivery.status === where.status
          : where.status.in.includes(state.delivery.status))
          ? state.delivery
          : null,
      create: async ({ data }) =>
        (state.delivery = {
          id: "delivery-1",
          attempts: 0,
          lastAttemptAt: null,
          providerMessageId: null,
          ...data,
        }),
      findUnique: async () => state.delivery,
      updateMany: async ({ where, data }) => {
        if (
          !state.delivery ||
          (typeof where.status === "string"
            ? state.delivery.status !== where.status
            : !where.status.in.includes(state.delivery.status))
        )
          return { count: 0 };
        const attempts = data.attempts
          ? state.delivery.attempts + data.attempts.increment
          : state.delivery.attempts;
        Object.assign(state.delivery, data, { attempts });
        return { count: 1 };
      },
    },
  };
  const access = {
    createSignedFileUrls: async (files) => {
      if (state.storageError) throw state.storageError;
      state.signed.push(...files);
      return files.map((file) => ({
        ...file,
        url: `https://storage.example/${file.path}?token=private`,
      }));
    },
    createSignedPdfUrl: async (input) => {
      state.signed.push(input);
      return {
        filename: input.filename,
        url: "https://storage.example/legacy?token=private",
      };
    },
  };
  const sender = {
    sendCourseDeliveryEmail: async (input) => {
      state.emails.push(input);
      if (state.emailError) throw state.emailError;
      return { providerMessageId: " message-1 " };
    },
  };
  const testModule = { exports: {} };
  const dependencies = {
    "server-only": {},
    "@/generated/prisma/client": enums,
    "@/lib/db": { db },
    "@/lib/course-private-storage": { coursePrivateFileAccess: access },
    "@/lib/course-delivery-email": { courseDeliveryEmailSender: sender },
  };
  vm.runInNewContext(
    compiled,
    {
      module: testModule,
      exports: testModule.exports,
      URL,
      Date,
      require: (name) => {
        assert.ok(
          Object.hasOwn(dependencies, name),
          `Unexpected dependency: ${name}`,
        );
        return dependencies[name];
      },
    },
    { filename: sourcePath },
  );
  return {
    state,
    service: testModule.exports,
    run: () =>
      testModule.exports.deliverPaidOrder({
        orderId: order.id,
        paymentId: payment.id,
      }),
  };
}

for (const [name, modify, expected] of [
  [
    "reject unpaid order",
    (s) => (s.order.status = "PENDING"),
    "ORDER_NOT_PAID",
  ],
  [
    "reject unpaid payment",
    (s) => (s.payment.status = "PENDING"),
    "PAYMENT_NOT_PAID",
  ],
  [
    "reject payment for another order",
    (s) => (s.payment.orderId = "another-order"),
    "PAYMENT_ORDER_MISMATCH",
  ],
  [
    "reject amount mismatch",
    (s) => (s.payment.amount = 4999),
    "PAYMENT_AMOUNT_MISMATCH",
  ],
  [
    "reject currency mismatch",
    (s) => (s.payment.currency = "EUR"),
    "PAYMENT_CURRENCY_MISMATCH",
  ],
  [
    "reject invalid quantity",
    (s) => (s.order.items[0].quantity = 2),
    "INVALID_COURSE_QUANTITY",
  ],
  [
    "reject inconsistent order total",
    (s) => (s.order.items[0].totalAmount = s.order.items[0].unitPrice = 4000),
    "ORDER_TOTAL_MISMATCH",
  ],
])
  test(name, async () => {
    const { state, run } = setup();
    modify(state);
    await assert.rejects(run, (error) => error.code === expected);
    assert.equal(state.enrollmentWrites.length, 0);
    assert.equal(state.emails.length, 0);
    assert.equal(state.signed.length, 0);
  });

test("deliver all ordered files and preserve legacy email PDF compatibility", async () => {
  const { state, run } = setup();
  const result = await run();
  assert.equal(result.deliveries[0].status, "SENT");
  assert.equal(state.emails[0].recipientEmail, "ada@example.com");
  assert.equal(state.signed[0].path, "private/guide.pdf");
  assert.equal(state.signed[1].path, "private/projet.zip");
  assert.equal(state.emails[0].files.length, 2);
  assert.equal(state.emails[0].pdf.filename, "guide.pdf");
  assert.equal(state.delivery.providerMessageId, "message-1");
  assert.equal(state.delivery.attempts, 1);
  assert.equal(state.enrollment.status, "ACTIVE");
  assert.ok(!JSON.stringify(state.delivery).includes("token=private"));
  const repeated = await run();
  assert.equal(repeated.deliveries[0].status, "ALREADY_SENT");
  assert.equal(state.emails.length, 1);
});

test("leave a recent processing delivery to its current worker", async () => {
  const { state, run } = setup();
  state.delivery = {
    id: "delivery-1",
    status: "PROCESSING",
    attempts: 1,
    lastAttemptAt: new Date(),
  };
  assert.equal((await run()).deliveries[0].status, "PROCESSING");
  assert.equal(state.emails.length, 0);
  assert.equal(state.signed.length, 0);
});

test("retry an interrupted processing delivery", async () => {
  const { state, run } = setup();
  state.delivery = {
    id: "delivery-1",
    status: "PROCESSING",
    attempts: 1,
    lastAttemptAt: new Date(Date.now() - 16 * 60 * 1000),
  };
  assert.equal((await run()).deliveries[0].status, "SENT");
  assert.equal(state.delivery.attempts, 2);
});

test("email failure preserves payment and access, masks private URLs, and allows retry", async () => {
  const { state, service, run } = setup();
  state.emailError = new Error(
    "Provider failed https://storage.example/file?token=secret",
  );
  assert.equal((await run()).deliveries[0].status, "FAILED");
  assert.equal(state.order.status, "PAID");
  assert.equal(state.payment.status, "PAID");
  assert.equal(state.enrollment.status, "ACTIVE");
  assert.ok(!state.delivery.errorMessage.includes("token=secret"));
  state.emailError = null;
  const result = await service.retryPaidOrderDelivery({
    orderId: state.order.id,
    paymentId: state.payment.id,
  });
  assert.equal(result.deliveries[0].status, "SENT");
  assert.equal(state.delivery.attempts, 2);
});

test("legacy PDF is delivered when no CourseFile exists", async () => {
  const { state, run } = setup();
  state.course.files = [];
  state.course.privatePdfPath = "legacy/course.pdf";
  state.course.privatePdfName = "legacy.pdf";
  assert.equal((await run()).deliveries[0].status, "SENT");
  assert.equal(state.signed[0].privatePdfPath, "legacy/course.pdf");
  assert.equal(state.emails[0].pdf.filename, "legacy.pdf");
});

test("private storage failure does not send an email", async () => {
  const { state, run } = setup();
  state.storageError = new Error("Storage unavailable");
  assert.equal((await run()).deliveries[0].status, "FAILED");
  assert.equal(state.emails.length, 0);
  assert.equal(state.enrollment.status, "ACTIVE");
});

test("reactivate an existing access without replacing its original order or payment", async () => {
  const { state, run } = setup();
  state.enrollment = {
    id: "enrollment-1",
    status: "REVOKED",
    orderId: "original-order",
    paymentId: "original-payment",
  };
  await run();
  assert.equal(state.enrollment.status, "ACTIVE");
  assert.equal(state.enrollment.orderId, "original-order");
  assert.equal(state.enrollment.paymentId, "original-payment");
});
