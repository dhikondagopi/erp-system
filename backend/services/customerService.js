const customerRepository = require('../repositories/customerRepository');

/**
 * Customer Service.
 * Implements core logical routines for Customer Management.
 */
class CustomerService {
  /**
   * Fetch customer by ID.
   */
  async getCustomerById(id) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      const error = new Error(`Customer with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }
    return customer;
  }

  /**
   * Fetch list of customers with search parameters.
   */
  async getAllCustomers(queryParams) {
    const { search, page = 1, limit = 50 } = queryParams;
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (parsedPage - 1) * parsedLimit;

    const { customers, total } = await customerRepository.findAll({
      search: search ? search.trim() : null,
      limit: parsedLimit,
      offset
    });

    return {
      customers,
      pagination: {
        totalItems: total,
        itemsPerPage: parsedLimit,
        currentPage: parsedPage,
        totalPages: Math.ceil(total / parsedLimit)
      }
    };
  }

  /**
   * Register a new customer profiles.
   */
  async createCustomer(customerData) {
    // Assert email uniqueness
    const existing = await customerRepository.findByEmail(customerData.email.trim());
    if (existing) {
      const error = new Error(`Customer profile conflict: Email '${customerData.email}' is already registered.`);
      error.statusCode = 409;
      throw error;
    }

    const formattedData = {
      ...customerData,
      name: customerData.name.trim(),
      email: customerData.email.trim().toLowerCase(),
      phone: customerData.phone ? customerData.phone.trim() : null,
      address: customerData.address ? customerData.address.trim() : null
    };

    return await customerRepository.create(formattedData);
  }

  /**
   * Update client properties.
   */
  async updateCustomer(id, customerData) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      const error = new Error(`Update failed: Customer with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }

    // Verify updated email conflict
    const emailMatch = await customerRepository.findByEmail(customerData.email.trim());
    if (emailMatch && emailMatch.id !== id) {
      const error = new Error(`Customer profile conflict: Email '${customerData.email}' is already used by another customer profile.`);
      error.statusCode = 409;
      throw error;
    }

    const formattedData = {
      ...customerData,
      name: customerData.name.trim(),
      email: customerData.email.trim().toLowerCase(),
      phone: customerData.phone ? customerData.phone.trim() : null,
      address: customerData.address ? customerData.address.trim() : null
    };

    return await customerRepository.update(id, formattedData);
  }

  /**
   * Remove a client directory row.
   */
  async deleteCustomer(id) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      const error = new Error(`Delete failed: Customer with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }

    return await customerRepository.delete(id);
  }
}

module.exports = new CustomerService();
