// 1. DOM Element Selection
const productForm = document.getElementById('product-form');
const productNameInput = document.getElementById('product-name');
const productCategoryInput = document.getElementById('product-category');
const productQuantityInput = document.getElementById('product-quantity');
const productPriceInput = document.getElementById('product-price');
const inventoryBody = document.getElementById('inventory-body');
const formErrorContainer = document.createElement('div');

// 2. Setup error container
formErrorContainer.id = 'form-errors';
formErrorContainer.style.color = 'red';
productForm.insertBefore(formErrorContainer, productForm.firstChild);

// 3. Local Storage Functions
function saveInventoryToStorage() {
    try {
        localStorage.setItem('inventoryItems', JSON.stringify(inventoryItems));
        localStorage.setItem('lastUpdated', new Date().toISOString());
        return true;
    } catch (error) {
        console.error('Failed to save inventory:', error);
        return false;
    }
}

function loadInventoryFromStorage() {
    try {
        const savedInventory = localStorage.getItem('inventoryItems');
        if (savedInventory) {
            return JSON.parse(savedInventory);
        }
        return [];
    } catch (error) {
        console.error('Failed to load inventory:', error);
        return [];
    }
}

function updateLastSavedStatus() {
    const lastUpdated = localStorage.getItem('lastUpdated');
    if (lastUpdated) {
        const date = new Date(lastUpdated);
        const formattedDate = date.toLocaleString();
        const statusElement = document.getElementById('last-saved-status');
        if (statusElement) {
            statusElement.textContent = Last saved: ${formattedDate};
        }
    }
}

// 4. Validation Functions
function validateProductName(name) {
    if (name.trim().length < 2) {
        return "Product name must be at least 2 characters long.";
    }
    if (name.trim().length > 50) {
        return "Product name cannot exceed 50 characters.";
    }
    return null;
}

function validateQuantity(quantity) {
    if (quantity <= 0) {
        return "Quantity must be greater than zero.";
    }
    if (!Number.isInteger(quantity)) {
        return "Quantity must be a whole number.";
    }
    if (quantity >= 1000) {
        return "You have reached maximum item quantity";
    }
    return null;
}

function validatePrice(price) {
    if (price <= 0) {
        return "Price must be greater than zero.";
    }
    return null;
}

function validateCategory(category) {
    if (category === "" || category === "Select Category") {
        return "Please select a valid category.";
    }
    return null;
}

function validateForm(name, quantity, price, category) {
    const errors = [];
    const nameError = validateProductName(name);
    const quantityError = validateQuantity(quantity);
    const priceError = validatePrice(price);
    const categoryError = validateCategory(category);
    
    if (nameError) errors.push(nameError);
    if (quantityError) errors.push(quantityError);
    if (priceError) errors.push(priceError);
    if (categoryError) errors.push(categoryError);
    
    return errors;
}

// 5. Edit Functions
function createEditableRow(product) {
    return `
        <tr data-id="${product.id}">
            <td>
                <input type="text" class="edit-input" value="${product.name}" />
            </td>
            <td>
                <select class="edit-input">
                    <option value="Perfume" ${product.category === 'Perfume' ? 'selected' : ''}>Khumra</option>
                    <option value="Turaren Wuta" ${product.category === 'Turaren Wuta' ? 'selected' : ''}>Turaren Wuta</option>
                    <option value="Accessories" ${product.category === 'Accessories' ? 'selected' : ''}>Khamshi Accessories</option>
                </select>
            </td>
            <td>
                <input type="number" class="edit-input" value="${product.quantity}" min="0" />
            </td>
            <td>
            <input type="number" class="edit-input" value="${product.price}" min="0" step="0.01" />
            </td>
            <td>${(product.quantity * product.price).toFixed(2)} NGN</td>
            <td>
                <button onclick="saveEdit(${product.id})" class="save-btn">Save</button>
                <button onclick="cancelEdit(${product.id})" class="cancel-btn">Cancel</button>
            </td>
        </tr>
    `;
}

function makeRowEditable(productId) {
    const product = inventoryItems.find(item => item.id === productId);
    const row = document.querySelector(`tr[data-id="${productId}"]`);
    row.outerHTML = createEditableRow(product);
}

function saveEdit(productId) {
    const row = document.querySelector(`tr[data-id="${productId}"]`);
    const inputs = row.querySelectorAll('.edit-input');
    
    const updatedProduct = {
        id: productId,
        name: inputs[0].value.trim(),
        category: inputs[1].value,
        quantity: Number(inputs[2].value),
        price: Number(inputs[3].value),
        totalValue: Number(inputs[2].value) * Number(inputs[3].value)
    };

    const validationErrors = validateForm(
        updatedProduct.name,
        updatedProduct.quantity,
        updatedProduct.price,
        updatedProduct.category
    );

    if (validationErrors.length > 0) {
        alert(validationErrors.join('\n'));
        return;
    }

    const index = inventoryItems.findIndex(item => item.id === productId);
    inventoryItems[index] = updatedProduct;
    
    if (saveInventoryToStorage()) {
        updateLastSavedStatus();
    }
    
    renderInventory();
}

function cancelEdit(productId) {
    renderInventory();
}

// 6. Initialize inventory array
let inventoryItems = [];

// 7. Form Submission Handler
productForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    formErrorContainer.innerHTML = '';
    
    const productName = productNameInput.value.trim();
    const productCategory = productCategoryInput.value;
    const productQuantity = Number(productQuantityInput.value);
    const productPrice = Number(productPriceInput.value);
    
    const validationErrors = validateForm(productName, productQuantity, productPrice, productCategory);
    
    if (validationErrors.length > 0) {
        validationErrors.forEach(error => {
            const errorElement = document.createElement('p');
            errorElement.textContent = error;
            formErrorContainer.appendChild(errorElement);
        });
        return;
    }
    
    const product = {
        id: Date.now(),
        name: productName,
        category: productCategory,
        quantity: productQuantity,
        price: productPrice,
        totalValue: productQuantity * productPrice
    };
    
    inventoryItems.push(product);
    
    if (saveInventoryToStorage()) {
        updateLastSavedStatus();
    }
    
    renderInventory();
    productForm.reset();
});

// 8. Delete Function
function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this item?')) {
        inventoryItems = inventoryItems.filter(product => product.id !== productId);
        if (saveInventoryToStorage()) {
            updateLastSavedStatus();
        }
        renderInventory();
    }
}

// 9. Render Function
function renderInventory() {
    inventoryBody.innerHTML = '';
    
    if (inventoryItems.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="6" style="text-align: center; color: gray;">
                No products in inventory
            </td>
        `;
        inventoryBody.appendChild(emptyRow);
        return;
    }
    
    inventoryItems.forEach(product => {
        const row = document.createElement('tr');
        row.dataset.id = product.id;
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.quantity}</td>
            <td>${product.price.toFixed(2)} NGN</td>
            <td>${product.totalValue.toFixed(2)} NGN</td>
            <td class="action-buttons">
                <button onclick="makeRowEditable(${product.id})" class="edit-btn">Edit</button>
                <button onclick="deleteProduct(${product.id})" class="delete-btn">Delete</button>
            </td>
        `;
        inventoryBody.appendChild(row);
    });
}

// 10. Initialize app
document.addEventListener('DOMContentLoaded', () => {
    inventoryItems = loadInventoryFromStorage();
    renderInventory();
    updateLastSavedStatus();
});