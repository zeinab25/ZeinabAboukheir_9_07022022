/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { toHaveClass } from "@testing-library/jest-dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router";

import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
	describe("When I am on Bills Page", () => {
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
			window.onNavigate(ROUTES_PATH.Bills);
			await waitFor(() => screen.getByTestId("icon-window"));
			const windowIcon = screen.getByTestId("icon-window");
			//to-do write expect expression
			expect(windowIcon).toHaveClass("active-icon");
		});
		test("Then bills should be ordered from earliest to latest", () => {
			document.body.innerHTML = BillsUI({ data: bills });
			const dates = screen
				.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
				.map((a) => a.innerHTML);
			const antiChrono = (a, b) => (a < b ? 1 : -1);
			const datesSorted = [...dates].sort(antiChrono);
			expect(dates).toEqual(datesSorted);
		});
	});

	describe("When I am on bill page but it is loading", () => {
		test("Then, Loading page should be rendered", () => {
			document.body.innerHTML = BillsUI({ loading: true });
			expect(screen.getAllByText("Loading...")).toBeTruthy();
		});
	});
	describe("When I am on bill page but back-end send an error message", () => {
		test("Then, Error page should be rendered", () => {
			document.body.innerHTML = BillsUI({ error: "some error message" });
			expect(screen.getAllByText("Erreur")).toBeTruthy();
		});
	});

	describe("When I am on Bills Page and I click on the icon eye", () => {
		test("then a modal should open", () => {
			const modal = ($.fn.modal = jest.fn());

			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				}),
			);
			document.body.innerHTML = BillsUI({ data: bills });
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};

			const store = null;
			const eye = screen.getAllByTestId("icon-eye")[0];

			const handleClickIconEye = jest.fn(
				new Bills({
					document,
					onNavigate,
					store,
					localStorage: window.localStorage,
				}).handleClickIconEye(eye),
			);

			eye.addEventListener("click", handleClickIconEye);
			userEvent.click(eye);

			expect(handleClickIconEye).toHaveBeenCalled();

			const modalcontainer = document.getElementById("modaleFile");
			expect(modalcontainer).toBeTruthy();
			expect(modal).toHaveBeenCalled();
		});
	});

	describe("When I am on Bills Page and I click on the new bill button", () => {
		test("NewBill page should render", () => {
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				}),
			);
			document.body.innerHTML = BillsUI({ data: bills });
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};
			const store = null;
			const btnNewBill = screen.getByTestId("btn-new-bill");

			const handleClickIconEye = jest.fn(
				new Bills({
					document,
					onNavigate,
					store,
					localStorage: window.localStorage,
				}).handleClickNewBill(),
			);

			btnNewBill.addEventListener("click", handleClickIconEye);
			userEvent.click(btnNewBill);

			expect(handleClickIconEye).toHaveBeenCalled();

			const pageNewBill = screen.getByTestId("form-new-bill");

			expect(pageNewBill).toBeTruthy();
		});
	});
});

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
	describe("When I navigate to Bills Page", () => {
		test("fetches bills from mock API GET", async () => {
			localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
			const root = document.createElement("div");
			root.setAttribute("id", "root");
			document.body.append(root);
			router();
			window.onNavigate(ROUTES_PATH.Bills);
			await waitFor(() => screen.getByTestId("tbody"));
			const bills = screen.getByTestId("tbody");
			expect(bills).toBeTruthy();
			expect(bills.childElementCount).toEqual(4);
		});
		describe("When an error occurs on API", () => {
			beforeEach(() => {
				jest.spyOn(mockStore, "bills");
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
			test("fetches bills from an API and fails with 404 message error", async () => {
				mockStore.bills.mockImplementationOnce(() => {
					return {
						list: () => {
							return Promise.reject(new Error("Erreur 404"));
						},
					};
				});
				window.onNavigate(ROUTES_PATH.Bills);
				await new Promise(process.nextTick);
				const message = await screen.getByText(/Erreur 404/);
				expect(message).toBeTruthy();
			});

			test("fetches messages from an API and fails with 500 message error", async () => {
				mockStore.bills.mockImplementationOnce(() => {
					return {
						list: () => {
							return Promise.reject(new Error("Erreur 500"));
						},
					};
				});

				window.onNavigate(ROUTES_PATH.Bills);
				await new Promise(process.nextTick);
				const message = await screen.getByText(/Erreur 500/);
				expect(message).toBeTruthy();
			});
		});
	});
});
