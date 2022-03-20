/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { toHaveClass } from "@testing-library/jest-dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router";
import BillsUI from "../views/BillsUI.js";
import userEvent from "@testing-library/user-event";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
	describe("When I am on NewBill Page", () => {
		test("Then bill icon in vertical layout should be highlighted", async () => {
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				}),
			);
			const root = document.createElement("div");
			root.setAttribute("id", "root");
			document.body.append(root);
			router();
			window.onNavigate(ROUTES_PATH.NewBill);
			await waitFor(() => screen.getByTestId("icon-mail"));
			const emailIcon = screen.getByTestId("icon-mail");
			expect(emailIcon).toHaveClass("active-icon");
		});
	});
	describe("When I am on NewBill Page and I select a image", () => {
		test("then the image is uploaded if the right extention is choose", () => {
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				}),
			);

			const html = NewBillUI();
			document.body.innerHTML = html;
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};
			const handleChangeFile = jest.fn((e) =>
				new NewBill({
					document,
					onNavigate,
					store: null,
					localStorage: window.localStorage,
				}).handleChangeFile(e),
			);
			const uploadFile = screen.getByTestId("file");

			uploadFile.addEventListener("change", handleChangeFile);

			fireEvent.change(uploadFile, {
				target: { files: [new File(["image"], "image.png", { type: "image/png" })] },
			});

			expect(handleChangeFile).toHaveBeenCalled();
			expect(uploadFile.files[0].type).toBe("image/png");
		});

		test("then if I upload a file with wrong extention , a alert appear and the file is not uploaded ", () => {
			jest.spyOn(window, "alert").mockImplementation(() => {});

			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				}),
			);
			const html = NewBillUI();
			document.body.innerHTML = html;
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};
			const handleChangeFile = jest.fn((e) =>
				new NewBill({
					document,
					onNavigate,
					store: null,
					localStorage: window.localStorage,
				}).handleChangeFile(e),
			);
			const uploadFile = screen.getByTestId("file");
			uploadFile.addEventListener("change", handleChangeFile);

			fireEvent.change(uploadFile, {
				target: {
					files: [new File(["image"], "fichier.pdf", { type: "application/pdf" })],
				},
			});

			expect(handleChangeFile).toHaveBeenCalled();
			expect(window.alert).toBeCalled();
		});
	});

	describe("When I am on NewBill Page and I completed all required fields", () => {
		test("then I can submit the form", async () => {
			const html = NewBillUI({});
			document.body.innerHTML = html;
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					email: "azerty@email.com",
				}),
			);
			const store = null;
			const newBill = new NewBill({
				document,
				onNavigate,
				store,
				localStorage: window.localStorage,
			});

			const bill = {
				type: "Transport",
				name: "Vol Paris Londres",
				amount: "300",
				date: "2022-08-03",
				vat: "20",
				pct: "10",
			};

			const uploadFile = screen.getByTestId("file");

			fireEvent.change(uploadFile, {
				target: { files: [new File(["image.png"], "image.png", { type: "image/png" })] },
			});

			screen.getByTestId("datepicker").value = bill.date;
			screen.getByTestId("expense-name").value = bill.name;
			screen.getByTestId("expense-type").value = bill.type;
			screen.getByTestId("amount").value = bill.amount;
			screen.getByTestId("vat").value = bill.vat;
			screen.getByTestId("pct").value = bill.pct;

			const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

			newBill.updateBill = jest.fn();

			const form = screen.getByTestId("form-new-bill");
			form.addEventListener("submit", handleSubmit);
			fireEvent.submit(form);
			expect(handleSubmit).toHaveBeenCalled();
			await waitFor(() => screen.getByText("Mes notes de frais"));
			const bills = screen.getByText("Mes notes de frais");
			expect(bills).toBeTruthy();
		});
	});
});

// test d'intégration POST
describe("Given I am a user connected as Employee", () => {
	describe("When I navigate to new bill Page", () => {
		test("post bill to API", async () => {
			const create = jest.spyOn(mockStore.bills(), "create");
			localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "e@e" }));
			const root = document.createElement("div");
			root.setAttribute("id", "root");
			document.body.append(root);
			router();
			window.onNavigate(ROUTES_PATH.NewBill);
			const uploadFile = screen.getByTestId("file");
			expect(uploadFile).toBeTruthy();
			const postData = {
				fileUrl: "https://localhost:3456/images/test.jpg",
				key: "1234",
			};
			mockStore.bills().create(postData);
			fireEvent.change(uploadFile, {
				target: { files: [new File(["image"], "test.jpg", { type: "image/png" })] },
			});
			expect(create).toHaveBeenCalled();
			expect(create).toHaveBeenCalledWith(postData);
		});

		describe("When an error occurs on API", () => {
			beforeEach(() => {
				jest.spyOn(mockStore, "bills");
				jest.spyOn(console, "error");
				Object.defineProperty(window, "localStorage", { value: localStorageMock });
				window.localStorage.setItem(
					"user",
					JSON.stringify({
						type: "Employee",
						email: "a@a",
					}),
				);
				const root = document.createElement("div");
				root.setAttribute("id", "root");
				document.body.appendChild(root);
				router();
			});

			test("try post bill to API and fails with 404 message error", async () => {
				const create = mockStore.bills.mockImplementationOnce(() => {
					return {
						create: () => {
							return Promise.reject(new Error("Erreur 404"));
						},
					};
				});

				window.onNavigate(ROUTES_PATH.NewBill);
				const uploadFile = screen.getByTestId("file");
				expect(uploadFile).toBeTruthy();

				fireEvent.change(uploadFile, {
					target: { files: [new File(["image"], "image.png", { type: "image/png" })] },
				});
				expect(create).toHaveBeenCalled();
				await new Promise(process.nextTick);
				expect(console.error).toHaveBeenCalled();
				expect(console.error).toHaveBeenCalledWith(Error("Erreur 404"));
			});

			test("try post bill to API and fails with 500 message error", async () => {
				const create = mockStore.bills.mockImplementationOnce(() => {
					return {
						create: () => {
							return Promise.reject(Error("Erreur 500"));
						},
					};
				});

				window.onNavigate(ROUTES_PATH.NewBill);
				const uploadFile = screen.getByTestId("file");
				expect(uploadFile).toBeTruthy();

				fireEvent.change(uploadFile, {
					target: { files: [new File(["image"], "image.png", { type: "image/png" })] },
				});
				expect(create).toHaveBeenCalled();
				await new Promise(process.nextTick);
				expect(console.error).toHaveBeenCalled();
				expect(console.error).toHaveBeenCalledWith(new Error("Erreur 500"));
			});
		});
	});
});
